const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Middleware: Authenticate Admin
const adminAuthMiddleware = async (req, res, next) => {
  let token = req.header("Authorization")
    ? req.header("Authorization").replace("Bearer ", "")
    : null;

  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = admin; // Attach admin to request
    next();
  } catch (error) {
    console.error("Admin authentication failed:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Optional: Role-based check (if needed later)
const isAdmin = (req, res, next) => {
  if (req.admin?.role === "Admin") return next();
  return res.status(403).json({ message: "Access denied. Admins only." });
};

module.exports = { adminAuthMiddleware, isAdmin };
