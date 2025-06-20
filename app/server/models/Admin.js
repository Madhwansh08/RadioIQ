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
      default: false,
    },
    mfaSecretToken: {
      type: [String],
      default: [
        OV2UMLSKGEXUEIZKHZKUKRZTNRISCJJSENTE6ZRDJMXGE5SWHNZQ,
        JFQUUUTZJFXFCVZ4HNVTWL2EPBFCY2KLEYXTQU3HNBGTAUZEIIQQ,
        LV4WMVSJM5TEMPBYLI3HEPTJJR5U4KCULNKGMZDOFZNXIVSIMM4A,
        KQRTOSD2LBOT4TLTHRQWW5SFMFTXK6BKOFBFONCJJJSTA2BQKRIQ,
        IUTGQN3MPIQT6WB4NMUTEULQJETGQTD3IBNHCVCWLZXDUUCHHFFA,
      ],
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
