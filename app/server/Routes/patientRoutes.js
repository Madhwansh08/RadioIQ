const express = require("express");
const router = express.Router();
const PatientController = require("../controllers/patientController");
const authMiddleware = require("../middleware/authMiddleware");
const endPoint = require("../endPoints.js");

/**
 * @swagger
 * /api/patients/{slug}:
 *   get:
 *     summary: Get patient by slug
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient slug
 *     responses:
 *       200:
 *         description: Patient data retrieved successfully
 *       404:
 *         description: Patient not found
 */
router.get(endPoint.getPatientBySlug, PatientController.getPatientBySlug);

/**
 * @swagger
 * /api/patients/{slug}/history:
 *   get:
 *     summary: Get patient history by slug
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient slug
 *     responses:
 *       200:
 *         description: Patient history retrieved successfully
 *       404:
 *         description: Patient history not found
 */
router.get(endPoint.getPatientHistory, PatientController.getPatientHistory);

/**
 * @swagger
 * /api/patients/{slug}/similar:
 *   get:
 *     summary: Find patients with similar abnormalities
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient slug
 *     responses:
 *       200:
 *         description: Similar patients retrieved successfully
 *       404:
 *         description: Similar patients not found
 */
router.get(
  endPoint.findPatientsWithSimilarAbnormalities,
  PatientController.findPatientsWithSimilarAbnormalities
);

/**
 * @swagger
 * /api/patients/get/AllPatients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All patients retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  endPoint.getAllPatients,
  authMiddleware,
  PatientController.getAllPatients
);

module.exports = router;
