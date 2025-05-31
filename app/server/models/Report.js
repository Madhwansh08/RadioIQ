// mapped with XRay model initial null
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  xrayId: { type: mongoose.Schema.Types.ObjectId, ref: "Xray", required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  tbScore: { type: Number, required: true },
  abnormalitiesFound: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
