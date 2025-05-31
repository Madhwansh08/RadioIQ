const fs = require("fs");
const { promisify } = require("util");
const sharp = require("sharp");
const XrayAbnormality = require("../models/XrayAbnormality");
const Patient = require("../models/Patient");
const Xray = require("../models/Xray");
const Doctor = require("../models/Doctor");
const slugify = require("slugify");
const unlinkAsync = promisify(fs.unlink);
const cache = require("../middleware/cache");
const { uploadToS3 } = require("../config/s3");
const axios = require("axios");
const abnormalitiesMap = require("../controllers/abnormalitiesMap");
const { v4: uuidv4 } = require("uuid");
const { SageMakerRuntimeClient, InvokeEndpointCommand } = require("@aws-sdk/client-sagemaker-runtime");
const { sendEvent } = require("../sse.js");
const { createCanvas, loadImage } = require("canvas");

// Create an instance of the SageMaker client.
const sagemakerClient = new SageMakerRuntimeClient({
  region: process.env.AI_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AI_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AI_AWS_SECRET_ACCESS_KEY,
  },
});

async function invokeSageMakerEndpoint(imageUrl, isInverted) {
  try {
    const payload = JSON.stringify({
      data: { url: imageUrl, isInverted },
    });

    const command = new InvokeEndpointCommand({
      EndpointName: process.env.AI_AWS_ENDPOINT,
      ContentType: "application/json",
      Body: payload,
      ClientTimeout: 60000,
    });

    const response = await sagemakerClient.send(command);
    const responseBody = JSON.parse(Buffer.from(response.Body).toString("utf-8"));
    return responseBody;
  } catch (error) {
    console.error("SageMaker Invocation Failed:", error);
    throw error;
  }
}

async function getNanoid() {
  const { nanoid } = await import("nanoid");
  return nanoid();
}

async function savePatientAndAssociateWithDoctor(patientData, doctorId) {
  let patient = await Patient.findOne({ patientId: patientData.patientId });
  if (!patient) {
    patient = new Patient({ ...patientData, doctorId });
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
    const uniqueId = uuidv4();
    const tempPath = `/tmp/${uniqueId}-image.png`;
    await fs.promises.writeFile(tempPath, buffer);
    const file = {
      path: tempPath,
      originalname: `${uniqueId}-image.png`,
      mimetype: "image/png",
    };
    const result = await uploadToS3(file, folder);
    await unlinkAsync(tempPath);
    return result;
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}

const abnormalitiesColorMap = {
  0: { name: "Lung Nodules",     color: "orange"     },
  1: { name: "Consolidation",     color: "green"      },
  2: { name: "Pleural Effusion",  color: "blue"       },
  3: { name: "Opacity",           color: "pink"       },
  4: { name: "Rib Fractures",     color: "darkorange" },
  5: { name: "Pneumothorax",      color: "cyan"       },
  6: { name: "Cardiomegaly",      color: "purple"     },
  7: { name: "Lymphadenopathy",   color: "red"        },
  8: { name: "Cavity",            color: "lightgreen"}
};

// A mapping from those color names to RGB for semi-transparent fills:
const colorNameToRgb = {
  orange:    [255, 165,   0],
  green:     [  0, 128,   0],
  blue:      [  0,   0, 255],
  pink:      [255, 192, 203],
  darkorange:[255, 140,   0],
  cyan:      [  0, 255, 255],
  purple:    [128,   0, 128],
  red:       [255,   0,   0],
  lightgreen:[144, 238, 144],
};



async function generateAnnotatedImage(imageUrl, abnormalities) {
  try {
    // 1. Fetch the image from S3
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // 2. Load into Canvas
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // 3. Draw each abnormality
    abnormalities.forEach(abn => {
      const seg = abn.segmentation?.[0];
      if (!Array.isArray(seg) || seg.length < 6) return;

      // Build point list
      const points = [];
      for (let i = 0; i < seg.length; i += 2) {
        points.push({ x: seg[i], y: seg[i+1] });
      }

      // Lookup name & color
      const info = abnormalitiesColorMap[abn.abnormality_id] || 
                   { name: "Unknown", color: "red" };
      const rgb = colorNameToRgb[info.color] || [255, 0, 0];

      // 3a. Draw polygon outline and fill
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      ctx.strokeStyle = info.color;
      ctx.lineWidth   = 2;
      ctx.stroke();

      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`;
      ctx.fill();

      // 3b. Find where to place the label
      const topPoint = points.reduce((min, p) => p.y < min.y ? p : min, points[0]);
      const textX = topPoint.x;
      const textY = Math.max(20, topPoint.y - 10);

      // 3c. Draw the label in **bold** and larger size
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = info.color;
      ctx.fillText(info.name, textX, textY);
    });

    // 4. Upload back to S3
    const annotatedBuffer = canvas.toBuffer("image/png");
    const uploadResult = await uploadImageToS3(annotatedBuffer, "xrays/annotated");
    return uploadResult.url;

  } catch (error) {
    console.error("Error generating annotated image:", error);
    throw error;
  }
}


async function processDicomFile(file, doctorId, clientId, index, totalFiles) {
  try {
    sendEvent(clientId, {
      status: "processing",
      fileName: file.originalname,
      progress: ((index + 1) / totalFiles) * 100,
    });

    const fileNameLower = file.originalname.toLowerCase();
    let patientId, age, sex, location, pngBuffer, cloudResponse, dicomUploadResponse;
    let isInverted = null;

    if (fileNameLower.endsWith(".png")) {
      patientId = `RV${await getNanoid()}`;
      age = 0;
      sex = "Unknown";
      location = "Unknown";

      pngBuffer = await sharp(file.path)
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
      const dicomUploadResult = await uploadDicomToS3(file);
      const originalDicomUrl = dicomUploadResult.url;
      let pythonResponse;
      try {
        const pyRes = await axios.post(
          "http://52.66.11.225/dicom/convert-to-png/",
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

    const modelResponse = await invokeSageMakerEndpoint(cloudResponse.url, isInverted);

    if (!modelResponse.lungs_found) {
      sendEvent(clientId, {
        status: "completed",
        fileName: file.originalname,
        message: "The image provided is not a valid lung X-ray",
      });
      return { error: "The image provided is not a valid lung X-ray" };
    }

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

    xray.lungsFound = modelResponse.lungs_found;
    xray.isNormal = modelResponse.is_normal;
    xray.ctr = {
      ratio: modelResponse.ctr?.ratio || null,
      imageUrl: modelResponse.ctr?.image || null,
    };

    if (modelResponse.is_normal) {
      xray.abnormalities = [];
      xray.modelannotated = null;
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

      // Generate and set the annotated image URL
      const annotatedUrl = await generateAnnotatedImage(cloudResponse.url, modelResponse.abnormalities);
      xray.modelannotated = annotatedUrl;
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

    await xray.save();
    patient.xrays.push(xray._id);
    await patient.save();

    sendEvent(clientId, {
      status: "completed",
      fileName: file.originalname,
      patient,
      xray,
    });

    await unlinkAsync(file.path);

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
    console.error(`Error processing file ${file.originalname}:`, error.message);
    sendEvent(clientId, {
      status: "error",
      fileName: file.originalname,
      message: error.message,
      errorCode: error.$metadata?.httpStatusCode || null,
    });
    return { error: `Error processing file ${file.originalname}` };
  }
}

exports.processDicomFile = processDicomFile;