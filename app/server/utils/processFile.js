const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { promisify } = require("util");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");
const axios = require("axios");
const XrayAbnormality = require("../models/XrayAbnormality");
const Patient = require("../models/Patient");
const Xray = require("../models/Xray");
const Doctor = require("../models/Doctor");
const { sendEvent } = require("../sse.js");
const abnormalitiesMap = require("../controllers/abnormalitiesMap.js");
const { createCanvas, loadImage } = require("canvas");

// Define host directories
const HOST_DICOM_INPUT_DIR = path.resolve(__dirname, "../../../dicom_input");
const HOST_OUTPUT_DIR = path.resolve(__dirname, "../../../data/output");

// Ensure directories exist
fs.mkdirSync(HOST_DICOM_INPUT_DIR, { recursive: true });
fs.mkdirSync(HOST_OUTPUT_DIR, { recursive: true });

// Helper to convert container path to host path
function toHostPath(containerPath) {
  if (containerPath.startsWith("/data/output")) {
    return path.join(HOST_OUTPUT_DIR, containerPath.substring("/data/output".length));
  } else if (containerPath.startsWith("/data/dicom_input")) {
    return path.join(HOST_DICOM_INPUT_DIR, containerPath.substring("/data/dicom_input".length));
  }
  return containerPath;
}

// Helper to convert host path to container path
function toContainerPath(hostPath) {
  if (hostPath.startsWith(HOST_DICOM_INPUT_DIR)) {
    return "/data/dicom_input" + hostPath.substring(HOST_DICOM_INPUT_DIR.length);
  } else if (hostPath.startsWith(HOST_OUTPUT_DIR)) {
    return "/data/output" + hostPath.substring(HOST_OUTPUT_DIR.length);
  }
  return hostPath;
}

// Helper to convert container path to URL
function toUrl(containerPath) {
  if (containerPath.startsWith("/data/output")) {
    return containerPath.replace("/data/output", "http://localhost:18080/static");
  }
  else if (containerPath.startsWith("/data/converted_png")) {
    return containerPath.replace("/data/converted_png", "http://localhost:18080/static");
  }
  else if (containerPath.startsWith("/data/dicom_input")) {
    return containerPath.replace("/data/dicom_input", "http://localhost:18080/static");
  }
  return containerPath;
}

// Local version of generateAnnotatedImage
const abnormalitiesColorMap = {
  0: { name: "Lung Nodules", color: "orange" },
  1: { name: "Consolidation", color: "green" },
  2: { name: "Pleural Effusion", color: "blue" },
  3: { name: "Opacity", color: "pink" },
  4: { name: "Rib Fractures", color: "darkorange" },
  5: { name: "Pneumothorax", color: "cyan" },
  6: { name: "Cardiomegaly", color: "purple" },
  7: { name: "Lymphadenopathy", color: "red" },
  8: { name: "Cavity", color: "lightgreen" }
};

const colorNameToRgb = {
  orange: [255, 165, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  pink: [255, 192, 203],
  darkorange: [255, 140, 0],
  cyan: [0, 255, 255],
  purple: [128, 0, 128],
  red: [255, 0, 0],
  lightgreen: [144, 238, 144]
};

async function generateAnnotatedImage(containerImagePath, abnormalities) {
  try {
    const hostImagePath = toHostPath(containerImagePath);
    console.log(hostImagePath)
    const imageBuffer = await fs.promises.readFile(hostImagePath);
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    abnormalities.forEach(abn => {
      const seg = abn.segmentation?.[0];
      if (!Array.isArray(seg) || seg.length < 6) return;

      const points = [];
      for (let i = 0; i < seg.length; i += 2) {
        points.push({ x: seg[i], y: seg[i + 1] });
      }

      const info = abnormalitiesColorMap[abn.abnormality_id] || { name: "Unknown", color: "red" };
      const rgb = colorNameToRgb[info.color] || [255, 0, 0];

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      ctx.strokeStyle = info.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`;
      ctx.fill();

      const topPoint = points.reduce((min, p) => p.y < min.y ? p : min, points[0]);
      const textX = topPoint.x;
      const textY = Math.max(20, topPoint.y - 10);

      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = info.color;
      ctx.fillText(info.name, textX, textY);
    });

    const annotatedFileName = path.basename(containerImagePath).replace(/\.[^.]+$/, "-annotated.png");
    const annotatedContainerPath = path.join("/data/output/", annotatedFileName);
    const annotatedHostPath = toHostPath(annotatedContainerPath);
    await fs.promises.mkdir(path.dirname(annotatedHostPath), { recursive: true });
    const annotatedBuffer = canvas.toBuffer("image/png");
    await fs.promises.writeFile(annotatedHostPath, annotatedBuffer);

    return toUrl(annotatedContainerPath);
  } catch (error) {
    console.error("Error generating annotated image:", error);
    throw error;
  }
}

// Helper to invoke the local AI model
async function invokeLocalModel(imageUrl, isInverted) {
  const modifiedUrl = `file://${imageUrl}`;
  try {
    const response = await axios.post("http://localhost:18080/invocations", {
      data: {
        url: modifiedUrl,
        isInverted,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Local Model Invocation Failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

// Helper to generate nanoid
async function getNanoid() {
  const { nanoid } = await import("nanoid");
  return nanoid();
}

// Helper to save patient and associate with doctor
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

// Main processing function
async function processDicomFile(file, doctorId, clientId, index, totalFiles) {
  try {
    sendEvent(clientId, {
      status: "processing",
      fileName: file.originalname,
      progress: ((index + 1) / totalFiles) * 100,
    });

    const fileNameLower = file.originalname.toLowerCase();
    let patientId, age, sex, location, dicomFileResponse;
    let isInverted = null;

    const fileBuffer = file.buffer || await fs.promises.readFile(file.path);
    const uniqueId = await getNanoid();
    const baseName = slugify(file.originalname.replace(/\.[^.]+$/, ""), { lower: true, strict: true });
    let fileExtension = path.extname(file.originalname);
    const localFileName = `${baseName}-${uniqueId}${fileExtension}`;
    const localFilePath = path.join(HOST_DICOM_INPUT_DIR, localFileName);

    if (fileNameLower.endsWith(".png")) {
      patientId = `RV${uniqueId}`;
      age = 0;
      sex = "Unknown";
      location = "Unknown";
      fileExtension = ".png";
      const pngBuffer = await sharp(fileBuffer)
        .resize(1024, 1024, { fit: "fill" })
        .png()
        .toBuffer();
      await fs.promises.writeFile(localFilePath, pngBuffer);
      dicomFileResponse = { url: toContainerPath(localFilePath) };
    } else if (
      fileNameLower.endsWith(".dic") ||
      fileNameLower.endsWith(".dcm") ||
      fileNameLower.endsWith(".dicom")
    ) {
      patientId = `RV${uniqueId}`;
      age = 0;
      sex = "Unknown";
      location = "Unknown";
      await fs.promises.writeFile(localFilePath, fileBuffer);
      dicomFileResponse = { url: toContainerPath(localFilePath) };
    } else {
      throw new Error("Unsupported file type: " + file.originalname);
    }

    const modelResponse = await invokeLocalModel(dicomFileResponse.url, isInverted);

    if (!modelResponse.lungs_found) {
      sendEvent(clientId, {
        status: "completed",
        fileName: file.originalname,
        message: "The image provided is not a valid lung X-ray",
      });
      return { error: "The image provided is not a valid lung X-ray" };
    }

    if (modelResponse.photometric_interpretation === "MONOCHROME1") {
      isInverted = true;
    } else if (modelResponse.photometric_interpretation === "MONOCHROME2") {
      isInverted = false;
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

    const xraySlug = `${slugify(localFileName, { lower: true, strict: true })}-${uuidv4()}`;
    const xray = new Xray({
      url: toUrl(modelResponse.converted_png),
      originalUrl: toUrl(dicomFileResponse.url),
      slug: xraySlug,
      patientId: patient._id,
      lungsFound: modelResponse.lungs_found,
      isNormal: modelResponse.is_normal,
      ctr: {
        ratio: modelResponse.ctr?.ratio || null,
        imageUrl: modelResponse.ctr?.image ? toUrl(modelResponse.ctr.image) : null,
      },
      zoom: modelResponse.lungs_bbox
        ? {
            x: modelResponse.lungs_bbox[0],
            y: modelResponse.lungs_bbox[1],
            width: modelResponse.lungs_bbox[2] - modelResponse.lungs_bbox[0],
            height: modelResponse.lungs_bbox[3] - modelResponse.lungs_bbox[1],
          }
        : null,
      boneSuppression: toUrl(modelResponse.bone_suppressed),
      heatmap: toUrl(modelResponse.heatmap),
      tbScore: modelResponse.tb_score,
      clahe: toUrl(modelResponse.clahe),
      modelannotated: null,
    });

    if (!modelResponse.is_normal && modelResponse.converted_png) {
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
      xray.modelannotated=null

  
    } else {
      xray.abnormalities = [];
    }

    await xray.save();
    patient.xrays.push(xray._id);
    await patient.save();

    sendEvent(clientId, {
      status: "completed",
      fileName: file.originalname,
      patient,
      xray,
    });

    if (file.path) {
      await fs.promises.unlink(file.path);
    }

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
    });
    return { error: `Error processing file ${file.originalname}` };
  }
}

exports.processDicomFile = processDicomFile;