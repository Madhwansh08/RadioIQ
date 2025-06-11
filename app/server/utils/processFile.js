// server/src/processDicom.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { promisify } = require("util");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");
const axios = require("axios");

const XrayAbnormality = require("../models/XrayAbnormality");
const Patient         = require("../models/Patient");
const Xray            = require("../models/Xray");
const Doctor          = require("../models/Doctor");
const { sendEvent }   = require("../sse.js");
const abnormalitiesMap = require("../controllers/abnormalitiesMap.js");
const { createCanvas, loadImage } = require("canvas");

// 1) Load environment variables (including ML_BASE_URL and ML_PUBLIC_URL) from server/.env
require("dotenv").config();

////////////////////////////////////////////////////////////////////////////////
// 2) In‐container paths; these must be bind-mounted in docker-compose:
////////////////////////////////////////////////////////////////////////////////
const HOST_DICOM_INPUT_DIR = "/data/dicom_input";
const HOST_OUTPUT_DIR      = "/data/output";

// ML_BASE_URL is for internal backend→ML calls; ML_PUBLIC_URL is for browser URLs
const ML_BASE_URL   = process.env.ML_BASE_URL   || "http://mlmodel:8080";
const ML_PUBLIC_URL = process.env.ML_PUBLIC_URL || "http://localhost:18080";

console.log(">>> ML_BASE_URL  is:", ML_BASE_URL);
console.log(">>> ML_PUBLIC_URL is:", ML_PUBLIC_URL);

// Ensure the bind-mounted directories exist (in case Docker didn’t create them yet)
try {
  fs.mkdirSync(HOST_DICOM_INPUT_DIR, { recursive: true });
  fs.mkdirSync(HOST_OUTPUT_DIR, { recursive: true });
} catch (mkdirErr) {
  console.warn("Could not mkdirSync on bind-mounted volume:", mkdirErr);
}

////////////////////////////////////////////////////////////////////////////////
// 3) Path helpers: We treat containerPath as the true on-disk path inside container.
////////////////////////////////////////////////////////////////////////////////

function toHostPath(containerPath) {
  // Because we’ve bind-mounted host/…/dicom_input → /data/dicom_input,
  // the container’s path is already the actual host path.
  return containerPath;
}

function toContainerPath(hostPath) {
  // Similarly, if passed a path starting with /data/dicom_input or /data/output,
  // that's already the in-container path. Return as-is.
  return hostPath;
}

function toUrl(containerPath) {
  // When returning a URL to the React app, replace the in-container prefix
  // (/data/output, /data/converted_png, or /data/dicom_input) with ML_PUBLIC_URL/static.
  if (containerPath.startsWith("/data/output")) {
    return containerPath.replace(
      "/data/output",
      `${ML_PUBLIC_URL}/static`
    );
  }
  if (containerPath.startsWith("/data/converted_png")) {
    return containerPath.replace(
      "/data/converted_png",
      `${ML_PUBLIC_URL}/static`
    );
  }
  if (containerPath.startsWith("/data/dicom_input")) {
    return containerPath.replace(
      "/data/dicom_input",
      `${ML_PUBLIC_URL}/static`
    );
  }
  return containerPath;
}

////////////////////////////////////////////////////////////////////////////////
// 4) Abnormality color maps (unchanged).
////////////////////////////////////////////////////////////////////////////////

const abnormalitiesColorMap = {
  0: { name: "Lung Nodules",    color: "orange" },
  1: { name: "Consolidation",    color: "green"  },
  2: { name: "Pleural Effusion", color: "blue"   },
  3: { name: "Opacity",          color: "pink"   },
  4: { name: "Rib Fractures",    color: "darkorange" },
  5: { name: "Pneumothorax",     color: "cyan"   },
  6: { name: "Cardiomegaly",     color: "purple" },
  7: { name: "Lymphadenopathy",  color: "red"    },
  8: { name: "Cavity",           color: "lightgreen" }
};

const colorNameToRgb = {
  orange:     [255, 165, 0],
  green:      [0, 128, 0],
  blue:       [0, 0, 255],
  pink:       [255, 192, 203],
  darkorange: [255, 140, 0],
  cyan:       [0, 255, 255],
  purple:     [128, 0, 128],
  red:        [255, 0, 0],
  lightgreen: [144, 238, 144]
};

async function generateAnnotatedImage(containerImagePath, abnormalities) {
  try {
    // containerImagePath might be like "/data/converted_png/abcd.png"
    const hostImagePath = toHostPath(containerImagePath);
    console.log("Reading image buffer from:", hostImagePath);
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

      const topPoint = points.reduce((min, p) => (p.y < min.y ? p : min), points[0]);
      const textX = topPoint.x;
      const textY = Math.max(20, topPoint.y - 10);

      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = info.color;
      ctx.fillText(info.name, textX, textY);
    });

    // Write the annotated PNG back to /data/output
    const annotatedFileName = path
      .basename(containerImagePath)
      .replace(/\.[^.]+$/, "-annotated.png");
    const annotatedContainerPath = path.join("/data/output", annotatedFileName);
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

////////////////////////////////////////////////////////////////////////////////
// 5) Invoke the ML model via ML_BASE_URL (internal).
////////////////////////////////////////////////////////////////////////////////

async function invokeLocalModel(imageUrl, isInverted) {
  // imageUrl might be "/data/dicom_input/abcd.dicom"
  const modifiedUrl = `file://${imageUrl}`;

  try {
    const response = await axios.post(
      `${ML_BASE_URL}/invocations`,
      {
        data: {
          url: modifiedUrl,
          isInverted
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Local Model Invocation Failed:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

////////////////////////////////////////////////////////////////////////////////
// 6) Utility: generate a nanoid string
////////////////////////////////////////////////////////////////////////////////

async function getNanoid() {
  const { nanoid } = await import("nanoid");
  return nanoid();
}

////////////////////////////////////////////////////////////////////////////////
// 7) Utility: save patient and link to doctor (unchanged)
////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
// 8) Main function: process one DICOM/PNG file
////////////////////////////////////////////////////////////////////////////////

async function processDicomFile(file, doctorId, clientId, index, totalFiles) {
  try {

    sendEvent(clientId, {
      status:   "processing",
      fileName: path.basename(file),
      progress: ((index + 1) / totalFiles) * 100
    });

    console.log(`Processing file ${index + 1}/${totalFiles}:`, file);

    const fileNameLower = file.toLowerCase();
    let patientId, age, sex, location, dicomFileResponse;
    let isInverted = null;

    // Get buffer from multer (if file.buffer exists) or disk
    const fileBuffer = file.buffer || (await fs.promises.readFile(file));
    const uniqueId   = await getNanoid();
    const baseName   = slugify(
      file.replace(/\.[^.]+$/, ""),
      { lower: true, strict: true }
    );
    let fileExtension = path.extname(file);
    const localFileName = `${baseName}-${uniqueId}${fileExtension}`;

    // Write to /data/dicom_input inside container
    const localFilePath = path.join(HOST_DICOM_INPUT_DIR, localFileName);

    if (fileNameLower.endsWith(".png")) {
      patientId = `RV${uniqueId}`;
      age       = 0;
      sex       = "Unknown";
      location  = "Unknown";
      fileExtension = ".png";

      // Resize PNG if needed, then write
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
      age       = 0;
      sex       = "Unknown";
      location  = "Unknown";
      await fs.promises.writeFile(localFilePath, fileBuffer);
      dicomFileResponse = { url: toContainerPath(localFilePath) };
    } else {
      throw new Error("Unsupported file type: " + file);
    }

    // Invoke the ML model
    const modelResponse = await invokeLocalModel(
      dicomFileResponse.url,
      isInverted
    );

    if (!modelResponse.lungs_found) {
      sendEvent(clientId, {
        status:   "completed",
        fileName: path.basename(file),
        message:  "The image provided is not a valid lung X-ray"
      });
      return { error: "The image provided is not a valid lung X-ray" };
    }

    // Determine whether the image is inverted
    if (modelResponse.photometric_interpretation === "MONOCHROME1") {
      isInverted = true;
    } else if (modelResponse.photometric_interpretation === "MONOCHROME2") {
      isInverted = false;
    }

    // Save or fetch patient document
    const patient = await savePatientAndAssociateWithDoctor(
      {
        patientId,
        slug:     slugify(patientId, { lower: true, strict: true }),
        age,
        sex,
        location,
        xrays:   []
      },
      doctorId
    );

    // Create new Xray document
    const xraySlug = `${slugify(localFileName, { lower: true, strict: true })}-${uuidv4()}`;
    const xray = new Xray({
      url:            toUrl(modelResponse.converted_png),
      originalUrl:    toUrl(dicomFileResponse.url),
      slug:           xraySlug,
      patientId:      patient._id,
      lungsFound:     modelResponse.lungs_found,
      isNormal:       modelResponse.is_normal,
      ctr: {
        ratio:     modelResponse.ctr?.ratio || null,
        imageUrl:  modelResponse.ctr?.image ? toUrl(modelResponse.ctr.image) : null
      },
      zoom: modelResponse.lungs_bbox
        ? {
            x:      modelResponse.lungs_bbox[0],
            y:      modelResponse.lungs_bbox[1],
            width:  modelResponse.lungs_bbox[2] - modelResponse.lungs_bbox[0],
            height: modelResponse.lungs_bbox[3] - modelResponse.lungs_bbox[1]
          }
        : null,
      boneSuppression: toUrl(modelResponse.bone_suppressed),
      heatmap:          toUrl(modelResponse.heatmap),
      tbScore:          modelResponse.tb_score,
      clahe:            toUrl(modelResponse.clahe),
      modelannotated:   null
    });

    // Insert abnormalities if present
    if (!modelResponse.is_normal && modelResponse.converted_png) {
      const insertedAbns = await XrayAbnormality.insertMany(
        modelResponse.abnormalities.map(abn => ({
          xray_id:              xray._id,
          name:                 abnormalitiesMap[abn.abnormality_id].name,
          score:                abn.confidence,
          annotation_coordinates: abn.bbox,
          segmentation:         abn.segmentation
        }))
      );
      xray.abnormalities = insertedAbns.map(a => a._id);
      const annotatedImageUrl = await generateAnnotatedImage(
        modelResponse.converted_png,
        modelResponse.abnormalities
      );
 
      xray.modelannotated = annotatedImageUrl;
    } else {
      xray.abnormalities = [];
    }

    await xray.save();
    patient.xrays.push(xray._id);
    await patient.save();

    sendEvent(clientId, {
      status:   "completed",
      fileName: path.basename(file),
      patient,
      xray
    });

    // Clean up multer temp file if it exists
    if (file) {
      await fs.promises.unlink(file);
    }

    return {
      patient: {
        patientId: patient.patientId,
        slug:      patient.slug,
        age:       patient.age,
        sex:       patient.sex,
        location:  patient.location
      },
      xray
    };
  } catch (error) {
    console.error(`Error processing file ${file}:`, error.message);
    sendEvent(clientId, {
      status:   "error",
      fileName: path.basename(file),
      message:  error.message
    });
    return { error: `Error processing file ${file}` };
  }
}

module.exports = {
  processDicomFile
};
