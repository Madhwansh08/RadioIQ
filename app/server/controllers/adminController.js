const Doctor = require("../models/Doctor");
const Admin = require("../models/Admin");
const Patient  = require("../models/Patient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
 
async function getNanoid() {
  const { customAlphabet } = await import("nanoid");
  // Define an alphabet of digits 1–9 and uppercase letters A–Z
  const alphabet = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // Create a nanoid generator that picks 6 characters from that alphabet
  const nanoid = customAlphabet(alphabet, 6);
  return nanoid();
}
 
exports.initiateAdminRegistration = async (req, res) => {
  try {
    const { name, email, password } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).send({ message: "Please fill all required fields" });
    }
 
    const adminExists = await Admin.findOne({});
    if (adminExists) {
      return res.status(403).send({ message: "Admin already exists. Cannot register another. Please Log-In" });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
    const resetCode = await getNanoid();
 
    const secret = speakeasy.generateSecret({
      name: `RadioIQ (${email})`
    });
 
    const qrCodeURL = await qrcode.toDataURL(secret.otpauth_url);
 
    // Respond without saving
    res.status(200).send({
      message: "Scan the QR to setup MFA and complete registration",
      tempData: {
        name,
        email,
        hashedPassword,
        role: "Admin",
        resetCode,
        mfaSecret: secret.base32
      },
      qrCodeURL
    });
  } catch (error) {
    console.error("Error in registration init:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
 
exports.completeAdminRegistration = async (req, res) => {
  try {
    const {
      name,
      email,
      hashedPassword,
      role,
      resetCode,
      mfaSecret,
      token
    } = req.body;
 
    const verified = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: "base32",
      token,
      window: 1
    });
 
    if (!verified) {
      return res.status(401).send({ message: "Invalid MFA token" });
    }
 
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
      resetCode,
      isPrimary: true,
      mfaSecret,
      mfaEnabled: true
    });
 
    await admin.save();
 
    res.status(201).send({
      message: "Admin registered successfully"
    });
 
  } catch (error) {
    console.error("Error completing admin registration:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
 
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).send({ message: "Please fill all required fields" });
    }
 
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }
 
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid Password" });
    }
 
    if (admin.mfaEnabled) {
      return res.status(206).send({
        message: "MFA required",
        mfaRequired: true,
        adminId: admin._id,
      });
    }
 
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
 
    res.status(200).send({
      message: "Login successful",
      success: true,
      admin: {
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
      },
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};
 
 
exports.verifyMfa = async (req, res) => {
  try {
    const { adminId, token: userToken } = req.body;
 
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.mfaEnabled) {
      return res.status(403).send({ message: "MFA not configured" });
    }
 
    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: "base32",
      token: userToken,
      window: 1,
    });
 
    if (!verified) {
      return res.status(401).send({ message: "Invalid or expired MFA token" });
    }
 
    const jwtToken = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
 
    res.status(200).send({
      message: "Login successful",
      success: true,
      token: jwtToken,
    });
  } catch (error) {
    console.error("MFA verification error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
 
 
 
exports.addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      password,
      dob = null,
      profilePicture = null,
      specialization = null,
      location = null,
      gender = null,
      hospital = null,
      role = "Doctor",
      isVerified = false,
      accountStatus = "Not Subscribed",
      subscriptionStartDate = null,
      subscriptionEndDate = null,
      patients = [],
    } = req.body;
 
    if (!name || !email || !phoneNumber || !password) {
      return res
        .status(400)
        .send({ message: "Please fill all required fields" });
    }
 
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res
        .status(400)
        .send({ message: "Phone number must be 10 digits" });
    }
 
    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingDoctor) {
      const field = existingDoctor.email === email ? "email" : "phone number";
      return res
        .status(409)
        .send({ message: `Doctor with this ${field} already exists` });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const resetCode = await getNanoid();
 
    const doctor = new Doctor({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      dob,
      profilePicture,
      specialization,
      location,
      hospital,
      gender,
      role,
      isVerified,
      accountStatus,
      subscriptionStartDate,
      subscriptionEndDate,
      patients,
      resetCode,
    });
 
    await doctor.save();
 
    res.status(201).send({
      message: "Doctor registered successfully",
      resetCode,
    });
  } catch (error) {
    console.error("Error registering doctor:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
 
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ role: "Doctor" });
 
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
 
exports.blockDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
 
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
 
    doctor.isBlocked = true;
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
 
    doctor.isBlocked = false;
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
    const xrayIds = patients.flatMap((patient) => patient.xrays);
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
    console.log(
      "X-rays deleted:",
      xrayIds.length > 0 ? xrayIds : "No X-rays found"
    );
 
    res.status(200).json({ message: "Doctor, patients, and xrays deleted." });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
 
 