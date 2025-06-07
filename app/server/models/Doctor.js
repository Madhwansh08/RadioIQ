/* Created By - Sarthak Raj
    Date:- 12 November 2024 
*/

// Desc: Model for Doctor

const mongoose = require("mongoose");

// Define schema for Doctor
const doctorSchema = new mongoose.Schema(
  {
    // Unique identifier for each doctor (Mongoose automatically generates this as '_id')
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    // Full name of the doctor
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Email address of the doctor (unique for each doctor)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Contact number for the doctor
    phoneNumber: {
      type: String,
      unique: false,
      sparse: true,
    },
    // Password for the doctor
    password: {
      type: String,
    },
    // Date of birth
    dob: {
      type: Date,
    },
    // URL for the doctor's profile picture
    profilePicture: {
      type: String,
    },
    location: {
      type: String,
    },
    specialization: {
      type: String,
    },
    hospital: {
      type: String,
    },
    gender: {
      type: String,
    },
    // Role of the doctor (e.g., 'Doctor', 'Admin', 'Developer')
    role: {
      type: String,
      enum: ["Doctor", "Admin", "Developer"],
      default: "Doctor",
    },
    // Verification status (indicates if the account has been verified)
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Account status (e.g., 'Subscribed', 'Not Subscribed')
    accountStatus: {
      type: String,
      enum: ["Subscribed", "Not Subscribed"],
      default: "Not Subscribed",
    },
    // Subscription start date
    subscriptionStartDate: {
      type: Date,
    },
    // Subscription end date
    subscriptionEndDate: {
      type: Date,
    },

    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
      },
    ],
    resetCode: { type: String },
    // Password reset token
    // resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    // verificationOTP: {
    //   type: String,
    // },
    // otpExpiresAt: {
    //   type: Date,
    // },

  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
  }
);

// Export the Doctor model
const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
