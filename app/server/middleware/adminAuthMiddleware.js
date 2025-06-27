const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Middleware: Authenticate Admin
const adminAuthMiddleware = async (req, res, next) => {
  let token = req.header("Authorization")
    ? req.header("Authorization").replace("Bearer ", "")
    : null;
  console.log("Token from header:", token);

  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const admin = await Admin.findOne({});
    console.log("Admin found:", admin);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    //Enforce MFA setup before continuing to protected operations
    if (!admin.mfaEnabled) {
      return res.status(403).json({
        message: "MFA not enabled. Please set up MFA to perform this operation.",
        mfaRequired: true,
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin authentication failed:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based check
const isAdmin = (req, res, next) => {
  if (req.admin?.role === "Admin") return next();
  return res.status(403).json({ message: "Access denied. Admins only." });
};

module.exports = { adminAuthMiddleware, isAdmin };
