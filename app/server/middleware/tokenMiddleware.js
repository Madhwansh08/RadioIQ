const Doctor = require("../models/Doctor");

const checkTokens = async (req, res, next) => {
  try {
    const doctorId = req.doctor._id;
    const filesCount = req.files.length;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.tokens < filesCount) {
      
      return res.status(400).json({ error: "Insufficient tokens for this upload" ,
        message: "Insufficient tokens for this upload",
      });
    }

    req.filesCount = filesCount;
    next();
  } catch (error) {
    console.error("Token Check Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = checkTokens;