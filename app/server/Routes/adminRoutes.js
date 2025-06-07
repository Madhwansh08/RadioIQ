const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");

router.get("/doctors", AdminController.getAllDoctors);
router.patch("/doctors/:doctorId/verify", AdminController.verifyDoctorById);
router.patch("/doctors/:doctorId/block", AdminController.blockDoctorById);
router.delete("/doctors/:doctorId", AdminController.deleteDoctorById);

module.exports = router;