const mongoose = require("mongoose");
const slugify = require("slugify");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: true,
    },
    sex: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    xrays: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Xray",
      },
    ],
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.pre("validate", function (next) {
  if (this.patientId) {
    this.slug = slugify(this.patientId, { lower: true, strict: true });
  }
  next();
});

// Delete X-rays when a Patient is deleted
patientSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc.xrays.length > 0) {
    await mongoose.model("Xray").deleteMany({ _id: { $in: doc.xrays } });
  }
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
