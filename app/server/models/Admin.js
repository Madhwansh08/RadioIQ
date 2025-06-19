const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    tokens: {
      type: Number,
      required: true,
      default: 10000,
    },
    role: {
      type: String,
      default: "Admin",
    },
    resetCode: {
      type: String,
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: true,
    },
    mfaSecret: { type: String },
    mfaEnabled: { 
       type: Boolean, 
       default: false 
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.index(
  { isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
