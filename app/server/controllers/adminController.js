const Doctor = require("../models/Doctor");
const Patient  = require("../models/Patient");
const xray = require("../models/Xray");

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find(
      {},
      "name email phoneNumber resetCode isVerified"
    );

    res.status(200).json({ doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
    
exports.verifyDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).json({ message: "Doctor manually verified." });
  } catch (error) {
    console.error("Error verifying doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Block a doctor manually (set isVerified.email = false)
exports.blockDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isVerified = false;
    await doctor.save();

    res.status(200).json({ message: "Doctor has been blocked (unverified)." });
  } catch (error) {
    console.error("Error blocking doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.unBlockDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).json({ message: "Doctor has been unblocked (verified)." });
  } catch (error) {
    console.error("Error unblocking doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Delete all patients for this doctor
    const patients = await Patient.find({ doctorId });

    // Delete each patient (to trigger their post-hooks for X-ray deletion)
    for (const patient of patients) {
      await Patient.findByIdAndDelete(patient._id); // triggers patientSchema.post('findOneAndDelete')
    }
    // fetch all the xrays associated with the patients
    const xrayIds = patients.flatMap(patient => patient.xrays);
    console.log("X-ray IDs to delete:", xrayIds);

    // Delete doctor after patients are removed
    const doctor = await Doctor.findByIdAndDelete(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    //verify if xrays are deleted
    if (xrayIds.length > 0) {
      const Xray = require("../models/Xray");
      await Xray.deleteMany({ _id: { $in: xrayIds } });
    }
    console.log("X-rays deleted:", xrayIds.length > 0 ? xrayIds : "No X-rays found");

    res.status(200).json({ message: "Doctor, patients, and xrays deleted." });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.checkMiddleware = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log("Checking doctor with ID:", doctorId);
    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ message: "Doctor exists", doctor });
  } catch (error) {
    console.error("Error checking doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

