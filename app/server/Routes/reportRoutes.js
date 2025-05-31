const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const endPoint = require("../endPoints.js");

/**
 * @swagger
 * /api/reports/{patientSlug}/{xraySlug}/report:
 *   get:
 *     summary: Generate report for a specific patient and x-ray
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: patientSlug
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient slug
 *       - in: path
 *         name: xraySlug
 *         schema:
 *           type: string
 *         required: true
 *         description: X-ray slug
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       404:
 *         description: Report not found
 */
router.get(endPoint.generateReport, reportController.generateReport);

/**
 * @swagger
 * /api/reports/get/AllReports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All reports retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  endPoint.getAllReports,
  authMiddleware,
  reportController.getAllReports
);

module.exports = router;
