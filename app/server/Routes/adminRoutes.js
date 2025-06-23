const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const {
  adminAuthMiddleware,
  isAdmin,
} = require("../middleware/adminAuthMiddleware");

// Admin Registration
router.post("/register", AdminController.initiateAdminRegistration);

// Login Flow
router.post("/login", AdminController.loginAdmin);
router.post("/verify-mfa", AdminController.verifyMfa);

// MFA Setup (post-login)
router.post("/setup-mfa", AdminController.setupAdminMfa);
router.post("/verify-mfa-setup", AdminController.verifyAndEnableMfa);

// Doctor Management
router.get("/doctors", AdminController.getAllDoctors);
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

router.get("/adminExists", AdminController.checkAdminExists);

router.post(
  "/assignTokens/:doctorId",
  adminAuthMiddleware,
  isAdmin,
  AdminController.assignTokensToDoctor
);

router.post(
  "/removeTokens/:doctorId",
  adminAuthMiddleware,
  isAdmin,
  AdminController.removeTokensFromDoctor
);

router.get(
  "/adminTokens",
  adminAuthMiddleware,
  isAdmin,
  AdminController.getAdminTokens
);

router.post(
  "/verifySingleAdminMFAToken",
  AdminController.verifySingleAdminTokenMFA
);


router.post(
  "/verify-payment-token",
  adminAuthMiddleware,
  isAdmin,
  AdminController.verifyAdminPaymentToken
);

router.post(
  "/assign-tokens-after-mfa",
  adminAuthMiddleware,
  isAdmin,
  AdminController.verifyTierTokenAndAssignTokens
);

module.exports = router;
