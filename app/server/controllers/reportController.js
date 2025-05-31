const Report = require("../models/Report");
const Xray = require("../models/Xray");
const Patient = require("../models/Patient");

// Generate report
exports.generateReport = async (req, res) => {
  try {
    const { patientSlug, xraySlug } = req.params;

    const patient = await Patient.findOne({ slug: patientSlug });
    if (!patient) {
      return res.status(404).send({ message: "Patient not found" });
    }

    const xray = await Xray.findOne({
      slug: xraySlug,
      patientId: patient._id,
    }).populate("abnormalities");
    if (!xray) {
      return res.status(404).send({ message: "X-ray not found" });
    }

    const reportData = {
      patientId: patient._id,
      xrayId: xray._id,
      age: patient.age,
      gender: patient.sex,

      location: patient.location,
      tbScore: xray.tbScore,
      abnormalitiesFound: xray.abnormalities.map(
        (abnormality) => abnormality.name
      ),
    };

    const report = new Report(reportData);
    await report.save();

    // Update the Xray model with the report ID
    xray.report = report._id;
    await xray.save();

    res.status(200).json({
      message: "Report generated successfully",
      report: report,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// get all reports
exports.getAllReports = async (req, res) => {
  try {
    const doctorId = req.doctor._id; // Retrieve the logged-in doctor's ID from the request
    console.log("Fetching all reports for doctor:", doctorId);

    // Find patients associated with the logged-in doctor
    const patients = await Patient.find({ doctorId }, "_id");
    const patientIds = patients.map((patient) => patient._id);

    // Count reports generated for the doctor's patients
    const reportsGenerated = await Report.countDocuments({
      patientId: { $in: patientIds },
    });

    // Fetch reports for the doctor's patients
    const reports = await Report.find({ patientId: { $in: patientIds } });

    res.status(200).json({ reports, reportsGenerated });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};
