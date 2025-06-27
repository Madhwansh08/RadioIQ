const Doctor = require("../models/Doctor");
const Admin = require("../models/Admin");
const Patient = require("../models/Patient");
const InferenceBox = require("../models/InferenceBox");
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
      return res
        .status(400)
        .send({ message: "Please fill all required fields" });
    }

    const adminExists = await Admin.findOne({});
    if (adminExists) {
      return res
        .status(403)
        .send({ message: "Admin already exists. Please log in." });
    }

    const inferenceBox = await InferenceBox.findOne({
      paymentMFAToken: { $exists: true, $ne: null },
    });

    if (!inferenceBox) {
      return res.status(400).send({
        message:
          "Inference box not configured. Please set up the box MFA before admin registration.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resetCode = await getNanoid();

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "Admin",
      resetCode,
      isPrimary: true,
      mfaEnabled: false,
      mfaAdminPayment: inferenceBox.paymentMFAToken,
    });

    await admin.save();

    res.status(201).send({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send({ message: "Please fill all required fields" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid password" });
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
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        mfaRequired: admin.mfaEnabled,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).send({ message: "Internal server error" });
  }
};

exports.verifyMfa = async (req, res) => {
  try {
    const { token } = req.body;

    const admin = await Admin.findOne();
    console.log("Admin found:", admin);
    console.log("Admin ", admin.mfaEnabled);
    if (!admin || !admin.mfaEnabled) {
      return res.status(403).send({ message: "MFA not configured" });
    }

    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: "base32",
      token,
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

exports.setupAdminMfa = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }

    let mfaSecret = admin.mfaSecret;

    if (!mfaSecret) {
      const secret = speakeasy.generateSecret({
        name: `RadioIQ (${admin.email})`,
      });
      mfaSecret = secret.base32;
      admin.mfaSecret = mfaSecret;
      await admin.save();
    }
    console.log("MFA Secret:", mfaSecret);
    const otpauth_url = speakeasy.otpauthURL({
      secret: mfaSecret,
      label: `RadioIQ (${admin.email})`,
      encoding: "base32",
    });

    const qrCodeURL = await qrcode.toDataURL(otpauth_url);
    res.status(200).send({ message: "Scan the QR to setup MFA", qrCodeURL });
  } catch (error) {
    console.error("Setup MFA error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.verifyAndEnableMfa = async (req, res) => {
  try {
    const { token } = req.body;

    const admin = await Admin.findOne();
    if (!admin || !admin.mfaSecret) {
      return res.status(400).send({
        message: "MFA secret not found. Please generate QR first.",
      });
    }

    // 🐞 Add logs for debugging
    console.log("🔐 Submitted OTP:", token);
    console.log("📦 Expected secret:", admin.mfaSecret);
    const generatedTOTP = speakeasy.totp({
      secret: admin.mfaSecret,
      encoding: "base32",
    });
    console.log("⏱️ TOTP generated at server:", generatedTOTP);

    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: "base32",
      token,
      window: 2, // Allow slight clock drift
    });

    if (!verified) {
      return res.status(401).send({ message: "Invalid MFA token" });
    }

    admin.mfaEnabled = true;
    await admin.save();

    res.status(200).send({ message: "MFA setup completed" });
  } catch (error) {
    console.error("❌ Verify MFA error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};


exports.checkAdminExists = async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    res.send({ exists: !!admin });
  } catch (error) {
    console.error("Verify MFA error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.checkMFAEnabled = async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    res.send({ mfaEnabled: admin ? admin.mfaEnabled : false });
  } catch (error) {
    console.error("Check MFA enabled error:", error);
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

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const doctorTokens = doctor.tokens;

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(500).json({ message: "Admin not found." });
    }

    admin.tokens += doctorTokens;
    await admin.save();

    const patients = await Patient.find({ doctorId });

    for (const patient of patients) {
      await Patient.findByIdAndDelete(patient._id);
    }
    const xrayIds = patients.flatMap((patient) => patient.xrays);

    await Doctor.findByIdAndDelete(doctorId);

    //verify if xrays are deleted
    if (xrayIds.length > 0) {
      const Xray = require("../models/Xray");
      await Xray.deleteMany({ _id: { $in: xrayIds } });
    }

    res.status(200).json({ message: "Doctor, patients, and xrays deleted." });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.assignTokensToDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { tier } = req.body;

    console.log("Assigning tokens to doctor:", doctorId, tier);
    if (!doctorId || !tier) {
      return res
        .status(400)
        .send({ message: "Doctor ID and tier are required" });
    }

    let tokensToBeAssigned;
    switch (tier) {
      case 1:
        tokensToBeAssigned = 1000;
        break;
      case 2:
        tokensToBeAssigned = 2000;
        break;
      case 3:
        tokensToBeAssigned = 3000;
        break;
      default:
        return res.status(400).send({ message: "Invalid tier selected" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ message: "Doctor not found" });
    }
    console.log("Doctor found:", doctor);
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(500).send({ message: "Admin not found" });
    }
    console.log("Admin found:", admin);
    if (admin.tokens < tokensToBeAssigned) {
      return res
        .status(400)
        .send({ message: "Insufficient tokens in admin account" });
    }

    doctor.tokens += tokensToBeAssigned;
    admin.tokens -= tokensToBeAssigned;

    await doctor.save();
    await admin.save();

    res.status(200).send({
      message: `Successfully assigned tokens to doctor ${doctor.name}`,
      doctorTokens: doctor.tokens,
      adminTokens: admin.tokens,
    });
  } catch (error) {
    console.error("Error assigning tokens:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.removeTokensFromDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { tokens } = req.body;

    if (!doctorId || !tokens) {
      return res
        .status(400)
        .send({ message: "Doctor ID and tokens are required" });
    }

    if (typeof tokens !== "number" || tokens <= 0) {
      return res
        .status(400)
        .send({ message: "Tokens must be a positive number" });
    }

    // Fetch the doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ message: "Doctor not found" });
    }

    if (doctor.tokens < tokens) {
      return res
        .status(400)
        .send({ message: "Doctor does not have enough tokens to remove" });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(500).send({ message: "Admin not found" });
    }

    doctor.tokens -= tokens;
    admin.tokens += tokens;

    await doctor.save();
    await admin.save();

    res.status(200).send({
      message: `Successfully removed ${tokens} tokens from doctor ${doctor.name}`,
      doctorTokens: doctor.tokens,
      adminTokens: admin.tokens,
    });
  } catch (error) {
    console.error("Error removing tokens:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.getAdminTokens = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }

    res.status(200).send({
      tokens: admin.tokens,
      message: "Admin tokens retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching admin tokens:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.verifySingleAdminTokenMFA = async (req, res) => {
  try {
    const { token, index } = req.body;

    if (!token || typeof index !== "number" || index < 0 || index > 4) {
      return res
        .status(400)
        .json({ message: "Token and valid index (0–4) are required." });
    }

    const admin = await Admin.findOne();
    if (!admin || !admin.mfaSecretToken || admin.mfaSecretToken.length !== 5) {
      return res
        .status(500)
        .json({ message: "MFA secrets not properly configured." });
    }

    const delta = speakeasy.totp.verifyDelta({
      secret: admin.mfaSecretToken[index],
      encoding: "base32",
      token,
      window: 2, // ±60s
    });

    console.log("Token:", token);
    console.log("Delta result:", delta);

    if (!delta) {
      return res
        .status(401)
        .json({ message: `Token for Tier ${index + 1} is invalid.` });
    }

    return res
      .status(200)
      .json({ message: `Token for Tier ${index + 1} verified.` });
  } catch (err) {
    console.error("Single MFA token verification failed:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.verifyAdminPaymentToken = async (req, res) => {
  try {
    const { paymentToken } = req.body;

    if (!paymentToken) {
      return res.status(400).send({ message: "Payment OTP is required" });
    }

    const admin = await Admin.findOne();
    if (!admin || !admin.mfaAdminPayment) {
      return res.status(403).send({ message: "Payment MFA not configured" });
    }

    const verified = speakeasy.totp.verify({
      secret: admin.mfaAdminPayment,
      encoding: "base32",
      token: paymentToken,
      window: 1,
    });

    if (!verified) {
      return res
        .status(401)
        .send({ message: "Invalid or expired payment OTP" });
    }

    res.status(200).send({ message: "Payment token verified successfully" });
  } catch (error) {
    console.error("verifyAdminPaymentToken error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.verifyTierTokenAndAssignTokens = async (req, res) => {
  try {
    const { tierToken, tier } = req.body;

    if (!tierToken || typeof tier !== "number") {
      return res.status(400).send({ message: "Tier and OTP are required" });
    }

    if (tier < 1 || tier > 5) {
      return res.status(400).send({ message: "Tier must be between 1 and 5" });
    }

    const admin = await Admin.findOne();
    if (!admin || !Array.isArray(admin.mfaSecretToken)) {
      return res
        .status(500)
        .send({ message: "MFA secret not properly configured" });
    }

    const index = tier - 1;
    const secret = admin.mfaSecretToken[index];

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: tierToken,
      window: 1,
    });

    if (!verified) {
      return res.status(401).send({ message: "Invalid tier OTP" });
    }

    const tokenAmounts = [5000, 10000, 20000, 50000, 100000];
    const tokensToAdd = tokenAmounts[index];

    admin.tokens += tokensToAdd;
    await admin.save();

    res.status(200).send({
      message: `Successfully assigned ${tokensToAdd} tokens`,
      newTotal: admin.tokens,
    });
  } catch (error) {
    console.error("verifyTierTokenAndAssignTokens error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
