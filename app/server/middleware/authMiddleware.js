// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");

const authMiddleware = async (req, res, next) => {
  // Try to get token from the Authorization header
  let token = req.header("Authorization")
    ? req.header("Authorization").replace("Bearer ", "")
    : null;
  
  // If not found, try to get it from cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doctor = await Doctor.findById(decoded.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    req.doctor = doctor;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    console.log("Checking doctor with ID:", doctorId);

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const doctor = await Doctor.findById(doctorId); // Await is necessary

    console.log("Doctor found:", doctor);

    if (doctor && doctor.role === "Admin") {
      return next();
    }

    return res.status(403).json({ message: "Access denied. Admins only." });
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { authMiddleware, isAdmin };
