const fs = require("fs");
const { promisify } = require("util");
const sharp = require("sharp");
const XrayAbnormality = require("../models/XrayAbnormality");
const Patient = require("../models/Patient");
const Xray = require("../models/Xray");
const Doctor = require("../models/Doctor");
const slugify = require("slugify");
const unlinkAsync = promisify(fs.unlink); // Use promisify to convert fs.unlink to a promise
const cache = require("../middleware/cache");
const { uploadToS3 } = require("../config/s3");
const axios = require("axios");
const abnormalitiesMap = require("./abnormalitiesMap");
const { v4: uuidv4 } = require("uuid");
const {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} = require("@aws-sdk/client-sagemaker-runtime");
const multer = require("multer");
// Configure Multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { getQueueForClient } = require("../queues/xrayQueue");
const { getWorkerForClient } = require("../workers/xrayWorker");
// We assume sendEvent is exported from your SSE helper
const { sendEvent } = require("../sse.js");

const sagemakerClient = new SageMakerRuntimeClient({
  region: process.env.AI_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AI_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AI_AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware for handling single file upload (model-annotated image)
exports.uploadMiddleware = upload.single("modelannotated");

async function invokeSageMakerEndpoint(imageUrl, isInverted) {
  try {
    const payload = JSON.stringify({
      data: {
        url: imageUrl,
        isInverted,
      },
    });

    const command = new InvokeEndpointCommand({
      EndpointName: process.env.AI_AWS_ENDPOINT,
      ContentType: "application/json",
      Body: payload,
      ClientTimeout: 60000,
    });

    const response = await sagemakerClient.send(command);
    const responseBody = JSON.parse(
      Buffer.from(response.Body).toString("utf-8")
    );
    return responseBody;
  } catch (error) {
    console.error("SageMaker Invocation Failed:", error);
    throw error;
  }
}

// Dynamic import helper for nanoid
async function getNanoid() {
  const { nanoid } = await import("nanoid");
  return nanoid();
}

// Helper function: Save patient and associate with a doctor
async function savePatientAndAssociateWithDoctor(patientData, doctorId) {
  let patient = await Patient.findOne({ patientId: patientData.patientId });
  if (!patient) {
    patient = new Patient({
      ...patientData,
      doctorId,
    });
    await patient.save();
  }
  const doctor = await Doctor.findById(doctorId);
  if (doctor && !doctor.patients.includes(patient._id)) {
    doctor.patients.push(patient._id);
    await doctor.save();
  }
  return patient;
}

async function uploadDicomToS3(file, folder = "xrays/dicom") {
  if (!file?.path) {
    throw new Error("Invalid DICOM file object");
  }
  try {
    console.log(`Uploading DICOM file: ${file.originalname} to S3...`);
    const result = await uploadToS3(file, folder);
    console.log(`DICOM file uploaded successfully: ${result.url}`);
    return result;
  } catch (error) {
    console.error("Error uploading DICOM to S3:", error);
    throw error;
  }
}

async function uploadImageToS3(buffer, folder = "xrays") {
  try {
    // Create a unique filename using UUID for S3 purposes
    const uniqueId = uuidv4();
    const tempPath = `/tmp/${uniqueId}-image.png`;
    await fs.promises.writeFile(tempPath, buffer);
    const file = {
      path: tempPath,
      originalname: `${uniqueId}-image.png`,
      mimetype: "image/png",
    };
    const result = await uploadToS3(file, folder);
    // Use unlinkAsync (promisified) to remove the temp file.
    await unlinkAsync(tempPath);
    return result;
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}

async function processDicomFile(file, doctorId, clientId, index, totalFiles) {
  try {
    // Send initial processing progress event
    sendEvent(clientId, {
      status: "processing",
      fileName: path.basename(file),
      progress: ((index + 1) / totalFiles) * 100,
    });

    console.log("Attempting to process files");
    console.log(file);

    const fileNameLower = file.toLowerCase();
    let patientId,
      age,
      sex,
      location,
      pngBuffer,
      cloudResponse,
      dicomUploadResponse;
    let isInverted = null;

    if (fileNameLower.endsWith(".png")) {
      // PNG Processing
      patientId = `RV${await getNanoid()}`;
      age = 0;
      sex = "Unknown";
      location = "Unknown";

      pngBuffer = await sharp(file)
        .resize(1024, 1024, { fit: "fill" })
        .png()
        .toBuffer();

      cloudResponse = await uploadImageToS3(pngBuffer);
      dicomUploadResponse = { url: cloudResponse.url };
    } else if (
      fileNameLower.endsWith(".dic") ||
      fileNameLower.endsWith(".dcm") ||
      fileNameLower.endsWith(".dicom")
    ) {
      // DICOM Processing using the Python conversion service
      const dicomUploadPromise = uploadDicomToS3(file);
      const dicomUploadResult = await dicomUploadPromise;
      const originalDicomUrl = dicomUploadResult.url;
      let pythonResponse;

      try {
        const pyRes = await axios.post(
          `${process.env.METADATA_URL}/dicom/convert-to-png/`,
          { file_url: originalDicomUrl }
        );

        pythonResponse = pyRes.data;
      } catch (error) {
        throw new Error("Python service conversion failed: " + error.message);
      }
      cloudResponse = { url: pythonResponse.png_url };
      dicomUploadResponse = { url: originalDicomUrl };

      if (pythonResponse.photometric_interpretation === "MONOCHROME1") {
        isInverted = true;
      } else if (pythonResponse.photometric_interpretation === "MONOCHROME2") {
        isInverted = false;
      }
      patientId = `RV${await getNanoid()}`;
      age = 0;
      sex = "Unknown";
      location = "Unknown";
    } else {
      throw new Error("Unsupported file type");
    }

    // Call AI service before saving any patient or xray record.
    const modelResponse = await invokeSageMakerEndpoint(
      cloudResponse.url,
      isInverted
    );

    // Check if lungs are detected
    if (!modelResponse.lungs_found) {
      sendEvent(clientId, {
        status: "completed",
        fileName: path.basename(file),
        message: "The image provided is not a valid lung X-ray",
      });
      return { error: "The image provided is not a valid lung X-ray" };
    }

    // Save patient and create xray record only if valid.
    const patient = await savePatientAndAssociateWithDoctor(
      {
        patientId,
        slug: slugify(patientId, { lower: true, strict: true }),
        age,
        sex,
        location,
        xrays: [],
      },
      doctorId
    );

    const xraySlug = `${slugify(cloudResponse.url.split("/").pop(), {
      lower: true,
      strict: true,
    })}-${uuidv4()}`;

    const xray = new Xray({
      url: cloudResponse.url,
      originalUrl: dicomUploadResponse.url,
      slug: xraySlug,
      patientId: patient._id,
    });

    // Process AI response results.
    xray.lungsFound = modelResponse.lungs_found;
    xray.isNormal = modelResponse.is_normal;
    xray.ctr = {
      ratio: modelResponse.ctr?.ratio || null,
      imageUrl: modelResponse.ctr?.image || null,
    };

    if (modelResponse.is_normal) {
      xray.abnormalities = [];
    } else {
      const abnormalities = await XrayAbnormality.insertMany(
        modelResponse.abnormalities.map((abnormality) => ({
          xray_id: xray._id,
          name: abnormalitiesMap[abnormality.abnormality_id].name,
          score: abnormality.confidence,
          annotation_coordinates: abnormality.bbox,
          segmentation: abnormality.segmentation,
        }))
      );
      xray.abnormalities = abnormalities.map((abnormality) => abnormality._id);
    }

    xray.zoom = modelResponse.lungs_bbox
      ? {
          x: modelResponse.lungs_bbox[0],
          y: modelResponse.lungs_bbox[1],
          width: modelResponse.lungs_bbox[2] - modelResponse.lungs_bbox[0],
          height: modelResponse.lungs_bbox[3] - modelResponse.lungs_bbox[1],
        }
      : null;
    xray.boneSuppression = modelResponse.bone_suppressed;
    xray.heatmap = modelResponse.heatmap;
    xray.tbScore = modelResponse.tb_score;
    xray.clahe = modelResponse.clahe;
    xray.modelannotated = null;

    await xray.save();
    patient.xrays.push(xray._id);
    await patient.save();

    sendEvent(clientId, {
      status: "completed",
      fileName: path.basename(file),
      patient,
      xray,
    });

    // Use unlinkAsync (promisified) to remove the file
    await unlinkAsync(file);

    return {
      patient: {
        patientId: patient.patientId,
        slug: patient.slug,
        age: patient.age,
        sex: patient.sex,
        location: patient.location,
      },
      xray,
    };
  } catch (error) {
    console.error(`Error processing file ${file}:`, error.message);
    sendEvent(clientId, {
      status: "error",
      fileName: path.basename(file),
      message: error.message,
      errorCode: error.$metadata?.httpStatusCode || null,
    });
    return { error: `Error processing file ${file}` };
  }
}

exports.processDicomFile = processDicomFile;

// The remainder of your code remains unchanged (uploadMultipleDicomXray, etc.)
exports.uploadMultipleDicomXray = async (req, res) => {
  const clientId = req.query.clientId || req.body.clientId;
  if (!clientId) {
    return res.status(400).json({ error: "clientId is required" });
  }

  let files = req.body.files; // Multer-populated for form uploads
  console.log("Starting files");
  console.log(files);
  // If no files uploaded via form, check for USB modal payload
  if (
    (!files || files.length === 0) &&
    req.body.files &&
    Array.isArray(req.body.files) &&
    req.body.files.length > 0
  ) {
    // Read files from USB paths
    const allowedRoots = ["/media/"];
    files = [];
    for (const filePath of req.body.files) {
      if (!allowedRoots.some((root) => filePath.startsWith(root))) {
        return res
          .status(403)
          .json({ error: `Invalid file location: ${filePath}` });
      }
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File not found: ${filePath}` });
      }
      const buffer = fs.readFileSync(filePath);
      files.push({
        buffer,
        originalname: path.basename(filePath),
        mimetype: mime.lookup(filePath) || "application/octet-stream",
        size: buffer.length,
      });
    }
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const doctorId = req.doctor._id;
    const clientQueue = getQueueForClient(clientId);
    getWorkerForClient(clientId);
    console.log("Files to be processed:");
    console.log(files);
    // Enqueue each file
    const jobPromises = files.map((file, index) =>
      clientQueue.add("xrayJob", {
        file,
        doctorId,
        clientId,
        index,
        totalFiles: files.length,
      })
    );
    await Promise.all(jobPromises);

    // Clear caches as needed
    await cache.del(`patients:${doctorId}`);
    await cache.del(`totalxrays:${doctorId}`);
    await cache.del(`xrayStats:${doctorId}`);
    await cache.del(`genderxrays:${doctorId}`);
    await cache.del(`agexrays:${doctorId}`);
    await cache.del(`daysxrays:${doctorId}`);
    await cache.del(`recentXrays:${doctorId}:*`);
    await cache.del(`allXrayObjects:${doctorId}`);
    await cache.del(`commonAbnormalities:${doctorId}`);

    return res.status(200).json({
      message: "All DICOM files enqueued for processing for client " + clientId,
      enqueuedJobs: files.length,
    });
  } catch (error) {
    console.error("Error in uploadMultipleDicomXray:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get request for fetching the Abnormalities from the xray
exports.getXrayAbnormalities = async (req, res) => {
  try {
    const { slug } = req.params;

    const xray = await Xray.findOne({ slug }).populate("abnormalities");
    if (!xray) {
      return res.status(404).send({ message: "X-ray not found" });
    }

    res.status(200).send(xray.abnormalities);
  } catch (error) {
    console.error("Error fetching X-ray abnormalities:", error);
    res
      .status(500)
      .send({ message: "Error fetching X-ray abnormalities", error });
  }
};

// Update DICOM X-ray
exports.updateDicomXray = async (req, res) => {
  const { patientId, sex, age, location, xray } = req.body;
  const doctorId = req.doctor._id;

  try {
    const slug = slugify(patientId || `PAT${Date.now()}`, {
      lower: true,
      strict: true,
    });

    let patient = await Patient.findOne({ patientId });

    if (patient) {
      patient.sex = sex || "Unknown";
      patient.age = age || 0;

      patient.location = location || "Unknown";
      if (!patient.xrays.includes(xray._id)) {
        patient.xrays.push(xray._id);
      }
      if (!patient.doctorId.equals(doctorId)) {
        patient.doctorId = doctorId; // Update doctorId if it's different
      }
      await patient.save();
    } else {
      patient = new Patient({
        patientId,
        slug,
        sex: sex || "Unknown",
        age: age || 0,

        location: location || "Unknown",
        xrays: [xray._id],
        doctorId,
      });
      await patient.save();

      const doctor = await Doctor.findById(doctorId);
      if (doctor && !doctor.patients.includes(patient._id)) {
        doctor.patients.push(patient._id);
        await doctor.save();
      }
    }

    // Update the X-ray with the new patient ID
    const existingXray = await Xray.findById(xray._id);
    if (existingXray) {
      existingXray.patientId = patient._id;
      await existingXray.save();
    }

    await cache.del(`patients:${doctorId}`);
    await cache.del(`totalxrays:${doctorId}`);
    await cache.del(`xrayStats:${doctorId}`);
    await cache.del(`genderxrays:${doctorId}`);
    await cache.del(`agexrays:${doctorId}`);
    await cache.del(`daysxrays:${doctorId}`);
    await cache.del(`recentXrays:${doctorId}:*`);
    await cache.del(`allXrayObjects:${doctorId}`);
    await cache.del(`commonAbnormalities:${doctorId}`);
    await cache.del(`xraysl:${existingXray.slug}`);

    res.status(200).json({
      message: "Patient record and X-ray updated successfully",
      patient,
      xray: existingXray,
    });
  } catch (error) {
    console.error("Error updating patient record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controllers/xrayController.js
exports.updateXrayBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { note, annotations, view } = req.body; // Accept both note and annotations
    const doctorId = req.doctor._id; // Retrieve authenticated doctor ID
    const file = req.file;

    // Find the X-ray and ensure the doctor has access
    const xray = await Xray.findOne({ slug }).populate("patientId");

    if (!xray) {
      return res.status(404).json({ message: "X-ray not found" });
    }

    // Ensure the doctor is authorized to modify this X-ray
    if (!xray.patientId?.doctorId?.equals(doctorId)) {
      return res.status(403).json({
        message: "Unauthorized: You don't have permission to update this X-ray",
      });
    }

    // Update the note field if provided
    if (note !== undefined) {
      xray.note = note;
    }

    if (view !== undefined) {
      xray.view = view;
    }

    // Update the annotations field if provided
    if (annotations !== undefined) {
      xray.annotations = annotations;
    }

    if (file) {
      const s3UploadResult = await uploadImageToS3(
        file.buffer,
        "xray_annotations"
      );
      xray.modelannotated = s3UploadResult.url;
    }

    await xray.save();
    console.log(xray);
    await cache.del(`xraysl:${slug}`);

    res.status(200).json({
      message: "X-ray updated successfully",
      updatedXray: xray,
    });
  } catch (error) {
    console.error("Error updating X-ray:", error);
    res.status(500).json({ message: "Error updating X-ray", error });
  }
};

exports.uploadMetaDataDicom = async (req, res) => {
  try {
    // 1) Ensure a doctor is authenticated
    if (!req.doctor || !req.doctor._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Doctor authentication required" });
    }

    const doctorId = req.doctor._id;

    // 2) Validate the presence of a DICOM file in formData
    if (!req.file) {
      return res.status(400).json({ message: "No DICOM file provided" });
    }

    console.log(
      `Doctor ${doctorId} is uploading a DICOM file: ${req.file.originalname}`
    );

    // 3) Upload file to S3
    const uploadResult = await uploadDicomToS3(req.file);
    if (!uploadResult || !uploadResult.url) {
      return res.status(500).json({ message: "Error uploading DICOM to S3" });
    }

    console.log(
      `File uploaded to S3 by Doctor ${doctorId}: ${uploadResult.url}`
    );

    // 4) Call the external service to extract metadata
    const externalServiceUrl = `${process.env.METADATA_URL}/dicom/extract/`;
    const metadataResponse = await axios.post(externalServiceUrl, {
      file_url: uploadResult.url,
    });

    // 5) Extract metadata from response
    const metadata = metadataResponse.data;

    // 6) Return the metadata response
    return res.status(200).json({
      message: "Metadata extracted successfully",
      metadata: metadata,
    });
  } catch (error) {
    console.error("Error extracting DICOM metadata:", error);
    return res.status(500).json({
      message: "Error extracting DICOM metadata",
      error: error.message,
    });
  }
};

exports.getXrayBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `xraysl:${slug}`;

    console.log("Fetching X-ray by slug:", slug);

    const cachedXraySlug = await cache.get(cacheKey);
    if (cachedXraySlug) {
      return res.status(200).json(JSON.parse(cachedXraySlug));
    }

    const xray = await Xray.findOne({ slug });
    if (!xray) {
      return res.status(404).send({ message: "X-ray not found" });
    }

    await cache.set(cacheKey, JSON.stringify(xray), 1800);

    res.status(200).send(xray);
  } catch (error) {
    console.error("Error fetching X-ray:", error);
    res.status(500).send({ message: "Error fetching X-ray", error });
  }
};

exports.getAllXrays = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // Retrieve the logged-in doctor's ID from the request
    const cacheKey = `totalxrays:${doctorId}`;

    const cachedTotalXrays = await cache.get(cacheKey);
    if (cachedTotalXrays) {
      return res.status(200).json(JSON.parse(cachedTotalXrays));
    }

    // Find patients associated with the logged-in doctor
    const patients = await Patient.find({ doctorId }, "_id");
    const patientIds = patients.map((patient) => patient._id);

    // Fetch xrays of the patients associated with the doctor
    const xrays = await Xray.find({ patientId: { $in: patientIds } }, "_id");

    await cache.set(cacheKey, JSON.stringify(xrays), 1800);

    res.status(200).send(xrays);
  } catch (error) {
    console.error("Error fetching xrays for the doctor:", error);
    res.status(500).send({ message: "Error fetching xrays", error });
  }
};

// Get all X-ray objects --> redis
exports.getAllXrayObjects = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const cacheKey = `allXrayObjects:${doctorId}`;

    // Check cache first
    const cachedXrayObjects = await cache.get(cacheKey);
    if (cachedXrayObjects) {
      return res.status(200).json(JSON.parse(cachedXrayObjects));
    }

    console.log("Fetching all X-ray objects for doctor:", doctorId);

    // Find patients associated with the logged-in doctor
    const patients = await Patient.find({ doctorId }, "_id");
    const patientIds = patients.map((patient) => patient._id);

    if (patientIds.length === 0) {
      const emptyResponse = { xrays: [], priorityCases: 0 };
      await cache.set(cacheKey, JSON.stringify(emptyResponse), 1800); // Cache for 30 mins
      return res.status(200).json(emptyResponse);
    }

    // Count priority cases for the doctor's patients
    const priorityCases = await Xray.countDocuments({
      patientId: { $in: patientIds },
      tbScore: { $gt: 84 },
    });

    // Fetch X-ray objects for the doctor's patients
    const xrays = await Xray.find({ patientId: { $in: patientIds } })
      .populate("patientId")
      .populate("abnormalities");

    const responseData = { xrays, priorityCases };

    // Cache the response for 30 minutes
    await cache.set(cacheKey, JSON.stringify(responseData), 1800);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching all X-ray objects:", error);
    res
      .status(500)
      .json({ message: "Error fetching all X-ray objects", error });
  }
};

// get all abnormalities
exports.getAllAbnormalities = async (req, res) => {
  try {
    const abnormalities = await XrayAbnormality.find();
    res.status(200).json(abnormalities);
  } catch (error) {
    console.error("Error fetching all abnormalities:", error);
    res
      .status(500)
      .json({ message: "Error fetching all abnormalities", error });
  }
};

exports.getCommonAbnormalities = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const cacheKey = `commonAbnormalities:${doctorId}`;

    // Check cache first
    const cachedAbnormalities = await cache.get(cacheKey);
    if (cachedAbnormalities) {
      return res.status(200).json(JSON.parse(cachedAbnormalities));
    }

    console.log("Fetching common abnormalities for doctor:", doctorId);

    // Find patients associated with the logged-in doctor
    const patients = await Patient.find({ doctorId }, "_id");
    const patientIds = patients.map((patient) => patient._id);

    if (patientIds.length === 0) {
      const emptyResponse = { topAbnormalities: [] };
      await cache.set(cacheKey, JSON.stringify(emptyResponse), 1800); // Cache for 30 mins
      return res.status(200).json(emptyResponse);
    }

    // Find X-rays of the associated patients within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const xrays = await Xray.find({
      patientId: { $in: patientIds },
      createdAt: { $gte: thirtyDaysAgo },
    }).populate("abnormalities");

    // Count occurrences of each abnormality
    const abnormalityCounts = {};
    xrays.forEach((xray) => {
      xray.abnormalities.forEach((abnormality) => {
        abnormalityCounts[abnormality.name] =
          (abnormalityCounts[abnormality.name] || 0) + 1;
      });
    });

    // Sort abnormalities by count and get the top 3
    const topAbnormalities = Object.entries(abnormalityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const responseData = { topAbnormalities };

    // Cache the response for 30 minutes
    await cache.set(cacheKey, JSON.stringify(responseData), 1800);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching common abnormalities:", error);
    res
      .status(500)
      .send({ message: "Error fetching common abnormalities", error });
  }
};

exports.getXraybyDays = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // Retrieve the logged-in doctor's ID from the request
    console.log("Fetching X-rays by days for doctor:", doctorId);
    const cacheKey = `daysxrays:${doctorId}`;

    const cachedDaysXrays = await cache.get(cacheKey);
    if (cachedDaysXrays) {
      return res.status(200).json(JSON.parse(cachedDaysXrays));
    }

    // Find patients associated with the logged-in doctor
    const patients = await Patient.find({ doctorId }, "_id");
    const patientIds = patients.map((patient) => patient._id);

    // Fetch xrays of the associated patients and group them by day
    const xrays = await Xray.aggregate([
      { $match: { patientId: { $in: patientIds } } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            dayOfWeek: { $dayOfWeek: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Format the result for better readability
    const formattedXrays = xrays.map((xray) => {
      const date = new Date(xray._id.year, xray._id.month - 1, xray._id.day);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      return {
        date: date.toLocaleDateString("en-US"),
        day: dayName,
        count: xray.count,
      };
    });

    await cache.set(cacheKey, JSON.stringify({ formattedXrays }), 1800);
    res.status(200).json({ formattedXrays });
  } catch (error) {
    console.error("Error fetching X-rays by days:", error);
    res.status(500).send({ message: "Error fetching X-rays by days", error });
  }
};

exports.getRecentXrays = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    let {
      page = 1,
      limit = 10,
      searchQuery = "",
      abnormalityFilter = "all",
    } = req.query;

    // Convert query parameters to numbers and ensure they are valid
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const cacheKey = `recentXrays:${doctorId}:page:${page}:limit:${limit}:search:${searchQuery}:abnormality:${abnormalityFilter}`;

    // Check cache first
    const cachedRecentXrays = await cache.get(cacheKey);
    if (cachedRecentXrays) {
      return res.status(200).json(JSON.parse(cachedRecentXrays));
    }

    // Find patients associated with the logged-in doctor
    let patientQuery = { doctorId };
    if (searchQuery) {
      // Search by slug or patientId (adjust regex as needed)
      patientQuery.slug = { $regex: searchQuery, $options: "i" };
    }
    const patients = await Patient.find(
      patientQuery,
      "_id patientId slug age "
    );
    const patientIds = patients.map((patient) => patient._id);

    if (patientIds.length === 0) {
      const emptyResponse = {
        recentXrays: [],
        totalPages: 0,
        currentPage: page,
        totalRecords: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      await cache.set(cacheKey, JSON.stringify(emptyResponse), 1800);
      return res.status(200).json(emptyResponse);
    }

    // Build filter for X-rays
    let xrayFilter = { patientId: { $in: patientIds } };

    // Apply abnormalities filter if provided
    if (abnormalityFilter === "none") {
      // Only X-rays with an empty abnormalities array
      xrayFilter.abnormalities = { $size: 0 };
    } else if (abnormalityFilter === "has") {
      // Only X-rays with non‑empty abnormalities; using $ne: [] works in many cases.
      xrayFilter.abnormalities = { $exists: true, $ne: [] };
    }
    // (If abnormalityFilter is "all", no extra filter is applied.)

    // Fetch total X-ray count for pagination metadata
    const totalXrays = await Xray.countDocuments(xrayFilter);
    const totalPages = Math.ceil(totalXrays / limit);
    const skip = (page - 1) * limit;
    if (skip >= totalXrays) {
      const noMoreDataResponse = {
        recentXrays: [],
        totalPages,
        currentPage: page,
        totalRecords: totalXrays,
        hasNextPage: false,
        hasPrevPage: page > 1,
      };
      await cache.set(cacheKey, JSON.stringify(noMoreDataResponse), 1800);
      return res.status(200).json(noMoreDataResponse);
    }

    // Fetch paginated X-rays
    const recentXrays = await Xray.find(xrayFilter)
      .populate({
        path: "patientId",
        select: "patientId slug age ",
      })
      .populate("abnormalities", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedXrays = recentXrays.map((xray) => ({
      xrayId: xray._id,
      patientId: xray.patientId.patientId,
      patientSlug: xray.patientId.slug,
      patientAge: xray.patientId.age,
      xraySlug: xray.slug,
      tbScore: xray.tbScore,
      abnormalities: xray.abnormalities.map((abnormality) => abnormality.name),
      createdAt: xray.createdAt, // MongoDB's creation timestamp
      updatedAt: xray.updatedAt, // Include updatedAt if needed
    }));

    const responseData = {
      recentXrays: formattedXrays,
      totalPages,
      currentPage: page,
      totalRecords: totalXrays,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    await cache.set(cacheKey, JSON.stringify(responseData), 1800);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching recent X-rays:", error);
    res.status(500).json({ message: "Error fetching recent X-rays", error });
  }
};

exports.editXray = async (req, res, next) => {
  try {
    const { xrayId, editedAbnormalities, tbScore } = req.body;

    // Find the original X-ray
    const originalXray = await Xray.findById(xrayId).populate("abnormalities");
    if (!originalXray) {
      return res.status(404).send({ message: "Original X-ray not found" });
    }

    // Copy original abnormalities
    const originalAbnormalities = originalXray.abnormalities.map(
      (abnormality) => abnormality.toString()
    );

    // Determine which abnormalities to keep and which to add
    const newAbnormalities = [];
    const abnormalitiesToKeep = [];
    for (const abnormality of editedAbnormalities) {
      if (originalAbnormalities.includes(abnormality._id)) {
        abnormalitiesToKeep.push(abnormality._id);
      } else {
        const xrayAbnormality = new XrayAbnormality({
          xray_id: originalXray._id,
          score: abnormality.score,
          name: abnormality.name,
          annotation_coordinates: abnormality.annotation_coordinates,
        });
        await xrayAbnormality.save();
        newAbnormalities.push(xrayAbnormality._id);
      }
    }

    // Update the X-ray with new and kept abnormalities and criticality score
    originalXray.editedAbnormalities = [
      ...abnormalitiesToKeep,
      ...newAbnormalities,
    ];
    originalXray.tbScore = tbScore;
    await originalXray.save();
    console.log("Updated X-ray with new abnormalities:", originalXray);

    res.status(200).send(originalXray);
  } catch (error) {
    console.error("Error editing X-ray:", error);
    res.status(400).send({ message: "Error editing X-ray", error });
  }
};

exports.getAbnormalityByGender = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // Retrieve the logged-in doctor's ID from the request
    const cacheKey = `genderxrays:${doctorId}`;

    const cachedGenderXrays = await cache.get(cacheKey);
    if (cachedGenderXrays) {
      return res.status(200).json(JSON.parse(cachedGenderXrays));
    }

    // Find patients associated with the logged-in doctor, including gender
    const patients = await Patient.find({ doctorId }, "_id sex");
    const patientIds = patients.map((patient) => patient._id);

    // Find xrays of the associated patients within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const xrays = await Xray.find({
      patientId: { $in: patientIds },
      createdAt: { $gte: thirtyDaysAgo },
    }).populate("abnormalities patientId"); // Populate patientId to get gender

    // Initialize an object to hold abnormality counts by gender
    const abnormalityByGender = {
      male: {},
      female: {},
      other: {},
    };

    // Loop through each X-ray and count abnormalities based on gender
    xrays.forEach((xray) => {
      const gender = xray.patientId.sex.toLowerCase(); // Get gender of the patient
      xray.abnormalities.forEach((abnormality) => {
        if (!abnormalityByGender[gender]) {
          abnormalityByGender[gender] = {};
        }
        abnormalityByGender[gender][abnormality.name] =
          (abnormalityByGender[gender][abnormality.name] || 0) + 1;
      });
    });

    // Sort and format the results for each gender
    const formattedAbnormalities = Object.keys(abnormalityByGender).reduce(
      (acc, gender) => {
        const sortedAbnormalities = Object.entries(abnormalityByGender[gender])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3) // Top 3 abnormalities per gender
          .map(([name, count]) => ({ name, count }));
        acc[gender] = sortedAbnormalities;
        return acc;
      },
      {}
    );

    await cache.set(
      cacheKey,
      JSON.stringify({ abnormalityByGender: formattedAbnormalities }),
      1800
    );
    res.status(200).json({ abnormalityByGender: formattedAbnormalities });
  } catch (error) {
    console.error("Error fetching abnormality by gender:", error);
    res
      .status(500)
      .send({ message: "Error fetching abnormality by gender", error });
  }
};

exports.getAbnormalityByAge = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // Retrieve the logged-in doctor's ID from the request
    const cacheKey = `agexrays:${doctorId}`;

    const cachedAgeXrays = await cache.get(cacheKey);
    if (cachedAgeXrays) {
      return res.status(200).json(JSON.parse(cachedAgeXrays));
    }

    // Find patients associated with the logged-in doctor, including age
    const patients = await Patient.find({ doctorId }, "_id age");
    const patientIds = patients.map((patient) => patient._id);

    // Find xrays of the associated patients within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const xrays = await Xray.find({
      patientId: { $in: patientIds },
      createdAt: { $gte: thirtyDaysAgo },
    }).populate("abnormalities patientId"); // Populate patientId to get age

    // Initialize an object to hold abnormality counts by age group
    const abnormalityByAge = {
      "0-18": {},
      "19-35": {},
      "36-50": {},
      "51-65": {},
      "66+": {},
    };

    // Loop through each X-ray and count abnormalities based on age group
    xrays.forEach((xray) => {
      const age = xray.patientId.age; // Get age of the patient
      let ageGroup;
      if (age <= 18) {
        ageGroup = "0-18";
      } else if (age <= 35) {
        ageGroup = "19-35";
      } else if (age <= 50) {
        ageGroup = "36-50";
      } else if (age <= 65) {
        ageGroup = "51-65";
      } else {
        ageGroup = "66+";
      }
      xray.abnormalities.forEach((abnormality) => {
        if (!abnormalityByAge[ageGroup]) {
          abnormalityByAge[ageGroup] = {};
        }
        abnormalityByAge[ageGroup][abnormality.name] =
          (abnormalityByAge[ageGroup][abnormality.name] || 0) + 1;
      });
    });

    // Sort and format the results for each age group
    const formattedAbnormalities = Object.keys(abnormalityByAge).reduce(
      (acc, ageGroup) => {
        const sortedAbnormalities = Object.entries(abnormalityByAge[ageGroup])
          .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
          .slice(0, 3) // Top 3 abnormalities per age group
          .map(([name, count]) => ({ name, count }));
        acc[ageGroup] = sortedAbnormalities;
        return acc;
      },
      {}
    );

    await cache.set(
      cacheKey,
      JSON.stringify({ abnormalityByAge: formattedAbnormalities }),
      1800
    );

    res.status(200).json({ abnormalityByAge: formattedAbnormalities });
  } catch (error) {
    console.error("Error fetching abnormality by age:", error);
    res
      .status(500)
      .send({ message: "Error fetching abnormality by age", error });
  }
};

exports.getAbnormalityByLocation = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // Retrieve the logged-in doctor's ID from the request

    // Find patients associated with the logged-in doctor, including location
    const patients = await Patient.find({ doctorId }, "_id location");
    const patientIds = patients.map((patient) => patient._id);

    // Find xrays of the associated patients within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const xrays = await Xray.find({
      patientId: { $in: patientIds },
      createdAt: { $gte: thirtyDaysAgo },
    }).populate("abnormalities patientId"); // Populate patientId to get location

    // Initialize an object to hold abnormality counts by location
    const abnormalityByLocation = {};

    // Helper function to extract the country from the location
    const extractCountry = (location) => {
      if (!location) return "Unknown"; // Handle missing location
      const parts = location.split(","); // Split by comma
      return parts[parts.length - 1].trim(); // Get the last part and trim whitespace
    };

    // Loop through each X-ray and count abnormalities based on country
    xrays.forEach((xray) => {
      const country = extractCountry(xray.patientId.location); // Extract country
      if (!abnormalityByLocation[country]) {
        abnormalityByLocation[country] = {};
      }
      xray.abnormalities.forEach((abnormality) => {
        abnormalityByLocation[country][abnormality.name] =
          (abnormalityByLocation[country][abnormality.name] || 0) + 1;
      });
    });

    // Sort and format the results for each country
    const formattedAbnormalities = Object.keys(abnormalityByLocation).reduce(
      (acc, country) => {
        const sortedAbnormalities = Object.entries(
          abnormalityByLocation[country]
        )
          .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
          .slice(0, 3) // Top 3 abnormalities per country
          .map(([name, count]) => ({ name, count }));
        acc[country] = sortedAbnormalities;
        return acc;
      },
      {}
    );

    res.status(200).json({ abnormalityByLocation: formattedAbnormalities });
  } catch (error) {
    console.error("Error fetching abnormality by location:", error);
    res
      .status(500)
      .send({ message: "Error fetching abnormality by location", error });
  }
};

exports.getNormalAbnormalXrays = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const cacheKey = `xrayStats:${doctorId}`;

    console.log("Fetching daily X-ray stats for doctor:", doctorId);

    // Check cache first
    const cachedXrayStats = await cache.get(cacheKey);
    if (cachedXrayStats) {
      return res.status(200).json(JSON.parse(cachedXrayStats));
    }

    // Find patients associated with the logged-in doctor
    const patients = await Patient.find({ doctorId }, "_id");
    const patientIds = patients.map((patient) => patient._id);

    // Fetch X-rays of the associated patients and group them by day, with normal & abnormal counts
    const xrayStats = await Xray.aggregate([
      { $match: { patientId: { $in: patientIds } } }, // Filter X-rays for the doctor's patients
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            dayOfWeek: { $dayOfWeek: "$createdAt" },
            isNormal: "$isNormal", // Grouping by normal & abnormal
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Process the results into a structured format
    const formattedXrayStats = {};

    xrayStats.forEach((xray) => {
      const date = new Date(xray._id.year, xray._id.month - 1, xray._id.day);
      const dayKey = date.toLocaleDateString("en-US");
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      if (!formattedXrayStats[dayKey]) {
        formattedXrayStats[dayKey] = {
          date: dayKey,
          day: dayName,
          normalCount: 0,
          abnormalCount: 0,
        };
      }

      if (xray._id.isNormal) {
        formattedXrayStats[dayKey].normalCount = xray.count;
      } else {
        formattedXrayStats[dayKey].abnormalCount = xray.count;
      }
    });

    // Convert object to array for better API response format
    const responseArray = Object.values(formattedXrayStats);

    // Store in cache for 1 hour
    await cache.set(
      cacheKey,
      JSON.stringify({ xrayStatsByDays: responseArray }),
      3600
    );

    res.status(200).json({ xrayStatsByDays: responseArray });
  } catch (error) {
    console.error("Error Fetching Normal Abnormal X-rays:", error);
    res
      .status(500)
      .send({ message: "Error fetching Normal & Abnormal X-rays", error });
  }
};

async function fetchPinCodesFromXray(doctorId) {
  try {
    // Fetch patients associated with the doctorId, selecting only the location field
    const patients = await Patient.find({ doctorId }, "location");

    // Extract 6-digit pin codes from patient.location
    const pinCodes = patients
      .map((patient) => {
        if (!patient.location || patient.location.toLowerCase() === "unknown") {
          return null;
        }
        const match = patient.location.match(/\b\d{6}\b/);
        return match ? match[0] : null;
      })
      .filter((pin) => pin !== null);

    // Return all pin codes, including duplicates
    return pinCodes;
  } catch (error) {
    console.error("Error fetching pincodes from patients:", error);
    throw error;
  }
}

exports.getHeatMapLink = async (req, res) => {
  try {
    const doctorId = req.doctor._id;

    // 1) Fetch pin codes from DB
    const pinCodes = await fetchPinCodesFromXray(doctorId);

    console.log("Fetched pin codes:", pinCodes);

    if (pinCodes.length === 0) {
      return res.status(404).json({
        message: "No valid pin codes found for the doctor's patients",
      });
    }

    // 2) Call the Python service with the correct payload format
    const pythonUrl = process.env.HEATMAP_URL;

    const payload = {
      type: "json",
      mode: "light",
      data: pinCodes,
    };

    const pythonResponse = await axios.post(pythonUrl, payload);

    const { file_url } = pythonResponse.data;

    // 3) Return the link
    return res.status(200).json({
      message: "Heatmap link fetched successfully",
      heatmapLink: file_url,
    });
  } catch (error) {
    console.error("Error fetching heatmap link:", error);
    return res.status(500).json({
      message: "Error fetching heatmap link",
      error: error.message,
    });
  }
};
