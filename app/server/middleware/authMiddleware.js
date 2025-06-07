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

const isAdmin = (req, res, next) => {
  console.log("Role : ",req.doctor.role);
  if (req.doctor && req.doctor.role === "Admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
}

module.exports = { authMiddleware, isAdmin };
