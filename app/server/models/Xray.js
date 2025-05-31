const mongoose = require("mongoose");
const slugify = require("slugify");

const xraySchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
  
    originalUrl: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    xray_date: {
      type: Date,
    },
    abnormalities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "XrayAbnormality",
      },
    ],
    tbScore: {
      //tbscore
      type: Number,
    },
    note: {
      type: String,
    },
    view: {
      type: String,
      default: "",
    },
    annotations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    lungsFound: { type: Boolean, default: false },
    isNormal: { type: Boolean, default: false },
    // lungs found -> false ... send pre defined response (tbScore Normal)
    clahe: { type: String, default: null }, // try in node
    ctr: {
      ratio: { type: Number, default: null },
      imageUrl: { type: String, default: null },
    },
    modelannotated:{
      type:String,
      default:null
    },
    zoom: {
      x: { type: Number, default: null },
      y: { type: Number, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    boneSuppression: { type: String, default: null },
    heatmap: { type: String, default: null },
    editedAbnormalities: [
      { type: mongoose.Schema.Types.ObjectId, ref: "XrayAbnormality" },
    ],
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

xraySchema.pre("validate", function (next) {
  if (this.url) {
    this.slug = slugify(this.url.split("/").pop(), {
      lower: true,
      strict: true,
    });
  }
  next();
});

const Xray = mongoose.model("Xray", xraySchema);
module.exports = Xray;
