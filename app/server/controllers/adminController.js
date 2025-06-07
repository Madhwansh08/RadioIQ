const Doctor = require("../models/Doctor");
const Patient  = require("../models/Patient");

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

exports.deleteDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Delete all patients for this doctor
    const patients = await Patient.find({ doctorId });

    // Delete each patient (to trigger their post-hooks for X-ray deletion)
    for (const patient of patients) {
      await Patient.findByIdAndDelete(patient._id); // triggers patientSchema.post('findOneAndDelete')
    }

    // Delete doctor after patients are removed
    const doctor = await Doctor.findByIdAndDelete(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    res.status(200).json({ message: "Doctor, patients, and xrays deleted." });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

