const express = require("express");
const { submitContactForm } = require("../controllers/contactController");
const endPoint = require("../endPoints.js");

const router = express.Router();

/**
 * @swagger
 * /api/contact/submit:
 *   post:
 *     summary: Submit contact details
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact details submitted successfully
 *       400:
 *         description: Bad request
 */
router.post(endPoint.submitContactForm, submitContactForm);

module.exports = router;
