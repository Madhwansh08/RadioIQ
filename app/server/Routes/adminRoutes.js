const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");

router.get("/doctors", authMiddleware, isAdmin, AdminController.getAllDoctors);
router.post("/doctors/add", authMiddleware, isAdmin, AdminController.addDoctor);
router.patch("/doctors/:doctorId/verify",authMiddleware, isAdmin, AdminController.verifyDoctorById);
router.patch("/doctors/:doctorId/block", authMiddleware, isAdmin,AdminController.blockDoctorById);
router.patch("/doctors/:doctorId/unblock", authMiddleware, isAdmin,AdminController.unBlockDoctorById);
router.delete("/doctors/:doctorId", authMiddleware, isAdmin,AdminController.deleteDoctorById);
router.get("/doctors/check/:doctorId",isAdmin, AdminController.checkMiddleware);

module.exports = router;