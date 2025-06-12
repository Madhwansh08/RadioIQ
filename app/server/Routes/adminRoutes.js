const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const AdminController = require("../controllers/adminController");
const {
  adminAuthMiddleware,
  isAdmin,
} = require("../middleware/adminAuthMiddleware");

// Admin Registration (2-step MFA secure)
router.post("/adminInitRegister", AdminController.initiateAdminRegistration);
router.post(
  "/adminCompleteRegister",
  AdminController.completeAdminRegistration
);

// Admin Login Flow
router.post("/adminLogin", AdminController.loginAdmin);
router.post("/adminVerifyMfa", AdminController.verifyMfa);

// Doctor Management (Admin Protected)
router.get(
  "/doctors",
  adminAuthMiddleware,
  isAdmin,
  AdminController.getAllDoctors
);
router.post(
  "/doctors/add",
  adminAuthMiddleware,
  isAdmin,
  AdminController.addDoctor
);
router.patch(
  "/doctors/:doctorId/verify",
  adminAuthMiddleware,
  isAdmin,
  AdminController.verifyDoctorById
);
router.patch(
  "/doctors/:doctorId/block",
  adminAuthMiddleware,
  isAdmin,
  AdminController.blockDoctorById
);
router.patch(
  "/doctors/:doctorId/unblock",
  adminAuthMiddleware,
  isAdmin,
  AdminController.unBlockDoctorById
);
router.delete(
  "/doctors/:doctorId",
  adminAuthMiddleware,
  isAdmin,
  AdminController.deleteDoctorById
);

router.get("/adminExists", async (req, res) => {
  const admin = await Admin.findOne({});
  res.send({ exists: !!admin });
});

module.exports = router;
