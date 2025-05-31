/* Created By - Sarthak Raj
    Date:- 13 November 2024 
*/

// Desc: Controller for authentication routes

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Doctor = require("../models/Doctor");
const crypto = require("crypto");
const fs = require("fs");
const emailQueue = require("../queues/emailQueue");
const cache = require("../middleware/cache");
const emailVerificationQueue = require("../queues/emailVerificationQueue");
const { uploadToS3 } = require("../config/s3");




async function getNanoid() {
  const { customAlphabet } = await import("nanoid");
  // Define an alphabet of digits 1–9 and uppercase letters A–Z
  const alphabet = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // Create a nanoid generator that picks 6 characters from that alphabet
  const nanoid = customAlphabet(alphabet, 6);
  return nanoid();
}



// Register a new doctor
exports.registerDoctor = async (req, res) => {
  try {
    const {
      name, email, phoneNumber, password, dob = null, profilePicture = null,
      specialization = null, location = null, gender = null, hospital = null,
      role = "Doctor", isVerified = { email: true },
      accountStatus = "Not Subscribed", subscriptionStartDate = null,
      subscriptionEndDate = null, patients = []
    } = req.body;

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).send({ message: "Please fill all required fields" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).send({ message: "Phone number must be 10 digits" });
    }

    const existingDoctor = await Doctor.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingDoctor) {
      const field = existingDoctor.email === email ? "email" : "phone number";
      return res.status(409).send({ message: `Doctor with this ${field} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const resetCode = generateResetCode();

     const resetCode = await getNanoid();


    const doctor = new Doctor({
      name, email, phoneNumber, password: hashedPassword, dob, profilePicture,
      specialization, location, hospital, gender, role, isVerified,
      accountStatus, subscriptionStartDate, subscriptionEndDate, patients,
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

// Login a doctor
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).send({ message: "Doctor not found" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set the token in an httpOnly cookie.
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7*24*60*60*1000 // 7 days
    });

    res.status(200).send({
      success: true,
      user: {
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phoneNumber,
        role: doctor.role,
      },
      message: "Login successful",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.logoutDoctor = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).send({ message: "Logout successful" });
  } catch (error) {
    res.status(500).send({ message: "Server error during logout" });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const {
      name,
      phoneNumber,
      dob,
      gender,
      specialization,
      location,
      hospital,
    } = req.body;

    if (name) doctor.name = name;

    if (phoneNumber) doctor.phoneNumber = phoneNumber;
    if (dob) doctor.dob = dob;

    if (gender) doctor.gender = gender;
    if (specialization) doctor.specialization = specialization;
    if (location) doctor.location = location;
    if (hospital) doctor.hospital = hospital;

    await doctor.save();

    await cache.del(`doctor:${doctorId}`);

    res.status(200).json({ message: "Doctor updated successfully" });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

// Request OTP for password reset
// exports.requestPasswordReset = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const doctor = await Doctor.findOne({ email });
//     if (!doctor) {
//       return res.status(404).send({ message: "Doctor not found" });
//     }

//     const otp = generateOTP();
//     doctor.resetPasswordOTP = otp;
//     doctor.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
//     await doctor.save();

//     const htmlContent = `
//     <html>
//     <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
//       <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
//         <!-- Header -->
//         <tr>
//           <td style="background: #030811; padding: 20px; text-align: center; color: #ffffff; font-size: 24px;">
//             Nuvo Ai
//           </td>
//         </tr>
//         <!-- Main Content -->
//         <tr>
//           <td style="padding: 20px;">
//             <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin: auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
//               <!-- Banner Image -->
//               <tr>
//                 <td style="text-align: center;">
//                   <img src="https://radioiq.s3.ap-south-1.amazonaws.com/static/Email_png.png" alt="Banner Image" style="width:100%; max-width:600px; display: block;">
//                 </td>
//               </tr>
//               <!-- Email Body -->
//               <tr>
//                 <td style="padding: 20px; color: #333333;">
//                   <h2 style="color: #030811;">Password Reset Request</h2>
//                   <p>Hello,</p>
//                   <p>Your OTP for password reset is: <strong style="color:#030811;">${otp}</strong></p>
//                   <p>This OTP will expire in 10 minutes. Please use it to reset your password.</p>
//                   <p>If you did not request a password reset, please ignore this email.</p>
//                   <p>Best regards,<br>Your Team</p>
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//         <!-- Footer -->
//         <tr>
//           <td style="background: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #888888;">
//             © 2025 Nuvo ai. All rights reserved.
//           </td>
//         </tr>
//       </table>
//     </body>
//     </html>
//   `;

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "RadioIQ - Your OTP for Resetting Password",
//       text: `Hello ,\n\nYour OTP for Password reset is: ${otp}.\nIt will expire in 10 minutes.\n\nBest,\nYour Team`,
//       html: htmlContent,
//     };

//     // Add OTP email job to queue
//     await emailQueue.add("sendEmail", mailOptions);
//     res.status(200).send({ message: "OTP sent to email" });
//   } catch (error) {
//     console.error("Error requesting password reset:", error);
//     res.status(500).send({ message: "Internal server error" });
//   }
// };

// // Verify OTP
// exports.verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const doctor = await Doctor.findOne({ email });
//     if (!doctor) {
//       return res.status(404).send({ message: "Doctor not found" });
//     }

//     if (
//       doctor.resetPasswordOTP !== otp ||
//       doctor.resetPasswordExpires < Date.now()
//     ) {
//       return res.status(400).send({ message: "Invalid or expired OTP" });
//     }

//     // Generate a temporary token to allow password reset
//     const tempToken = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     }); // 15 minutes expiration

//     res.status(200).send({ message: "OTP verified successfully", tempToken });
//   } catch (error) {
//     console.error("Error verifying OTP:", error);
//     res.status(500).send({ message: "Internal server error" });
//   }
// };

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).send({ message: "Email, reset code, and new password are required." });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).send({ message: "Doctor not found." });
    }

    if (doctor.resetCode !== resetCode) {
      return res.status(400).send({ message: "Invalid reset code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = hashedPassword;

    await doctor.save();

    res.status(200).send({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to S3 instead of Cloudinary
    const result = await uploadToS3(req.file, "doctors/profile_pictures");

    // Update the doctor's profile picture URL
    doctor.profilePicture = result.url;
    await doctor.save();

    // Delete the local file after upload
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: doctor.profilePicture,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    // Clean up local file if upload fails
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProfilePicture = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // ID of the logged-in doctor from authMiddleware
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ profilePicture: doctor.profilePicture });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDoctorDetails = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // ID of the logged-in doctor from authMiddleware
    const cacheKey = `doctor:${doctorId}`;

    const cachedDoctor = await cache.get(cacheKey);
    if (cachedDoctor) {
      return res.status(200).json(cachedDoctor);
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await cache.set(cacheKey, doctor, 1800);

    res.status(200).json(doctor);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.requestRegistrationOTP = async (req, res) => {
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
      isVerified = { email: false },
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

    // Check if doctor already exists
    let doctor = await Doctor.findOne({ email });

    if (doctor) {
      return res
        .status(409)
        .send({
          message: "Doctor with this email already exists.",
        });
    } else {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      doctor = new Doctor({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role,
        isVerified: { email: false },
        accountStatus,
        dob,
        profilePicture,
        specialization,
        location,
        gender,
        hospital,
        subscriptionStartDate,
        subscriptionEndDate,
        patients,
      });

      await doctor.save();
    }
    // Generate OTP
    const otp = generateOTP();
    const otpToken = jwt.sign(
      {
        otp,
        email,
        phoneNumber,
        password,
        name,
        dob,
        profilePicture,
        specialization,
        location,
        gender,
        hospital,
        role,
        isVerified,
        accountStatus,
        subscriptionEndDate,
        subscriptionStartDate,
        patients,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const htmlContent = `
    <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- Header -->
        <tr>
          <td style="background: #030811; padding: 20px; text-align: center; color: #ffffff; font-size: 24px;">
            Nuvo Ai
          </td>
        </tr>
        <!-- Main Content -->
        <tr>
          <td style="padding: 20px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin: auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
              <!-- Banner Image -->
              <tr>
                <td style="text-align: center;">
                  <img src="https://radioiq.s3.ap-south-1.amazonaws.com/static/Email_png.png" alt="Banner Image" style="width:100%; max-width:600px; display: block;">
                </td>
              </tr>
              <!-- Email Body -->
              <tr>
                <td style="padding: 20px; color: #333333;">
                  <h2 style="color: #030811;">Verification OTP</h2>
                  <p>Hello,</p>
                  <p>Your OTP for verification is: <strong style="color:#030811;">${otp}</strong></p>
                  <p>Best regards,<br>Your Team</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #888888;">
            © 2025 Nuvo ai. All rights reserved.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "RadioIQ - Your OTP for Registration",
      text: `Hello ${name},\n\nYour OTP for registration is: ${otp}.\nIt will expire in 10 minutes.\n\nBest,\nYour Team`,
      html: htmlContent,
    };

    // Add OTP email job to queue
    await emailQueue.add("sendEmail", mailOptions);

    res.status(200).send({ message: "OTP sent to email", otpToken });
  } catch (error) {
    console.error("Error sending registration OTP:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { otpToken, enteredOTP } = req.body;

    // Decode token
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    if (!decoded || decoded.otp !== enteredOTP) {
      return res.status(400).send({ message: "Invalid or expired OTP" });
    }

    // Find the doctor by email
    const doctor = await Doctor.findOne({ email: decoded.email });
    if (!doctor) {
      return res.status(404).send({ message: "Doctor not found" });
    }

    // Update verification status
    doctor.isVerified.email = true;
    await doctor.save();

    res.status(200).send({ message: "Doctor verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.getVerificationStatus = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ isVerified: doctor.isVerified?.email || false });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.requestVerificationOTP = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.isVerified?.email) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // ✅ Generate OTP
    const otp = generateOTP();
    
    // Save OTP and expiration to doctor document
    doctor.verificationOTP = otp;
    doctor.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await doctor.save();

    // ✅ Create JWT Token with OTP (no expiration)
    const otpToken = jwt.sign({ otp, email: doctor.email }, process.env.JWT_SECRET);

    // ✅ Generate Email Content with OTP
    const htmlContent = `
    <html>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- Header -->
        <tr>
          <td style="background: #030811; padding: 20px; text-align: center; color: #ffffff; font-size: 24px;">
            Nuvo Ai
          </td>
        </tr>
        <!-- Main Content -->
        <tr>
          <td style="padding: 20px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin: auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
              <!-- Banner Image -->
              <tr>
                <td style="text-align: center;">
                  <img src="https://res.cloudinary.com/dh0kdktqr/image/upload/v1742287641/email_x7yxk6.jpg" alt="Banner Image" style="width:100%; max-width:600px; display: block;">
                </td>
              </tr>
              <!-- Email Body -->
              <tr>
                <td style="padding: 20px; color: #333333;">
                  <h2 style="color: #030811;">Verification OTP</h2>
                  <p>Hello,</p>
                  <p>Your OTP for verification is: <strong style="color:#030811;">${otp}</strong></p>
                  <p>Best regards,<br>Your Team</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #888888;">
            © 2025 Nuvo ai. All rights reserved.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: doctor.email,
      subject: "RadioIQ - Your OTP for Verification",
      html: htmlContent,
    };

    // ✅ Add Email to Queue
    await emailQueue.add("sendEmail", mailOptions);

    return res.status(200).json({ 
      message: "Verification OTP sent to your email.", 
      otpToken 
    });

  } catch (error) {
    console.error("❌ Error requesting OTP verification:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyVerificationOTP = async (req, res) => {
  try {
    // ✅ Get doctorId from the request (attached by middleware)
    const doctorId = req.doctor._id;

    // ✅ Validate doctorId
    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized access. Doctor ID not found." });
    }

    // ✅ Get OTP and token from request body
    const { otpToken, enteredOTP } = req.body;

    // ✅ Validate input
    if (!otpToken || !enteredOTP) {
      return res.status(400).json({ message: "OTP and token are required." });
    }

    // ✅ Decode and verify JWT token (ignore expiration)
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired OTP token." });
    }

    // ✅ Find doctor by ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // ✅ Check if email is already verified
    if (doctor.isVerified?.email) {
      return res.status(400).json({ message: "Email already verified." });
    }

    // ✅ Check OTP expiration
    if (!doctor.otpExpiresAt || doctor.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // ✅ Validate OTP
    if (doctor.verificationOTP !== enteredOTP) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // ✅ Mark email as verified
    doctor.isVerified.email = true;
    doctor.verificationOTP = undefined; // Clear OTP after verification
    doctor.otpExpiresAt = undefined; // Clear expiration time
    await doctor.save();

    // ✅ Return success response
    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};