const Patient = require("../models/Patient");
const Xray = require("../models/Xray");
const XrayAbnormality = require("../models/XrayAbnormality");
const cache = require("../middleware/cache");
// Fetch a patient by slug
exports.getPatientBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const patient = await Patient.findOne({ slug }).populate("xrays");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      patient: {
        patientId: patient.patientId,
        slug: patient.slug,
        sex: patient.sex,
        age: patient.age,

        location: patient.location,
      },
      xrays: patient.xrays.map((xray) => ({
        id: xray._id,
        slug: xray.slug,
        url: xray.url,
      })),
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get patient history by patient slug fetching xray information and sending the data to the client
exports.getPatientHistory = async (req, res) => {
  try {
    const { slug } = req.params;

    const patient = await Patient.findOne({ slug }).populate({
      path: "xrays",
      select: "slug abnormalities tbScore createdAt",
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const xrays = await Promise.all(
      patient.xrays.map(async (xray) => ({
        id: xray._id,
        slug: xray.slug,
        abnormalities: await Promise.all(
          xray.abnormalities.map(async (abnormalityId) => {
            const abnormality = await XrayAbnormality.findById(abnormalityId);
            return abnormality ? abnormality.name : null;
          })
        ),
        tbScore: xray.tbScore,
        createdAt: xray.createdAt,
      }))
    );

    res.status(200).json({
      patient: {
        patientId: patient.patientId,
      },
      xrays,
    });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const cacheKey = `patients:${doctorId}`;

    const cachedPatients = await cache.get(cacheKey);
    if (cachedPatients) {
      return res.status(200).json(cachedPatients);
    }

    const patients = await Patient.find({ doctorId });
    await cache.set(cacheKey, patients, 1800);

    res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching all patients:", error);
    res.status(500).json({ message: "Error fetching all patients", error });
  }
};

// Find patients with similar abnormalities
exports.findPatientsWithSimilarAbnormalities = async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch the current patient
    const currentPatient = await Patient.findOne({ slug }).populate({
      path: "xrays",
      select: "abnormalities",
    });

    if (!currentPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Get the list of abnormalities for the current patient
    const currentAbnormalities = await XrayAbnormality.find({
      _id: { $in: currentPatient.xrays.flatMap((xray) => xray.abnormalities) },
    }).select("name");
    const currentAbnormalityNames = currentAbnormalities.map(
      (abnormality) => abnormality.name
    );

    const similarPatients = await Patient.find({
      _id: { $ne: currentPatient._id },
    }).populate({
      path: "xrays",
      populate: {
        path: "abnormalities",
        select: "name",
      },
      select: "slug url abnormalities tbScore",
    });

    // Filter xrays to only include those with matching abnormalities
    const filteredPatients = similarPatients.filter((patient) => {
      patient.xrays = patient.xrays.filter((xray) =>
        xray.abnormalities.some((abnormality) =>
          currentAbnormalityNames.includes(abnormality.name)
        )
      );
      return patient.xrays.length > 0;
    });

    res.status(200).json(filteredPatients);
  } catch (error) {
    console.error("Error finding patients with similar abnormalities:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
