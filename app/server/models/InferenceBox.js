const mongoose = require("mongoose");

const inferenceBoxSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: {
        type: String,
        required: true,
        trim: true
    },
    boxNo: {
        type: String,
        required: true,
        trim:true,
        unique: true
    },
    paymentMFAToken: {
        type: String,
    },
    paymentMFAEnabled: {
        type: Boolean,
        default: false,
        required: true
    }
})

const InferenceBox = mongoose.model("InferenceBox", inferenceBoxSchema);

module.exports = InferenceBox;