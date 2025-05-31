/* Created By - Sarthak Raj
    Date:- 12 November 2024 
*/

// Desc: Model for X-ray Abnormality

const mongoose = require("mongoose");

const xrayAbnormalitySchema = new mongoose.Schema(
  {
    // X-ray ID (reference to the X-ray)
    xray_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Xray",
      required: true,
    },

    // Unique identifier for the abnormality
    id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    // Name of the abnormality
    name: {
      type: String,
      required: true,
    },

    // Score of the abnormality
    score: {
      type: Number,
      required: true,
    },

    // Coordinates for the annotation // bbox and segmentation and a location id
    annotation_coordinates: {
      type: [Number],
      required: true,
    },
    segmentation: {
      type: [[Number]],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
  }
);

// Export the XrayAbnormality model
const XrayAbnormality = mongoose.model(
  "XrayAbnormality",
  xrayAbnormalitySchema
);

module.exports = XrayAbnormality;
