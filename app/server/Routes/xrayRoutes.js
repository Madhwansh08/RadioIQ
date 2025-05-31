const express = require("express");
const multer = require("multer");
const XrayController = require("../controllers/XrayController");
const authMiddleware = require("../middleware/authMiddleware");
const endPoint = require("../endPoints.js");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * /api/xrays/dicom/update:
 *   put:
 *     summary: Update a DICOM X-ray file
 *     tags: [Xrays]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: DICOM X-ray updated successfully
 *       400:
 *         description: Bad request
 */
router.put(
  endPoint.updateDicomXray,
  authMiddleware,
  XrayController.updateDicomXray
);

/**
 * @swagger
 * /api/xrays/{slug}:
 *   get:
 *     summary: Get X-ray by slug
 *     tags: [Xrays]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: X-ray slug
 *     responses:
 *       200:
 *         description: X-ray data retrieved successfully
 *       404:
 *         description: X-ray not found
 */
router.get(endPoint.getXrayBySlug, XrayController.getXrayBySlug);

/**
 * @swagger
 * /api/xrays/{slug}/abnormalities:
 *   get:
 *     summary: Get abnormalities from the X-ray
 *     tags: [Xrays]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: X-ray slug
 *     responses:
 *       200:
 *         description: Abnormalities retrieved successfully
 *       404:
 *         description: Abnormalities not found
 */
router.get(endPoint.getXrayAbnormalities, XrayController.getXrayAbnormalities);

/**
 * @swagger
 * /api/xrays/get/AllXrays:
 *   get:
 *     summary: Get all X-rays
 *     tags: [Xrays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All X-rays retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(endPoint.getAllXrays, authMiddleware, XrayController.getAllXrays);

/**
 * @swagger
 * /get/AllXraysObjects:
 *   get:
 *     summary: Get all X-ray objects
 *     tags: [Xrays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All X-ray objects retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  endPoint.getAllXrayObjects,
  authMiddleware,
  XrayController.getAllXrayObjects
);

/**
 * @swagger
 * /api/xrays/get/AllAbnormalities:
 *   get:
 *     summary: Get all abnormalities
 *     tags: [Xrays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All abnormalities retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  endPoint.getAllAbnormalities,
  authMiddleware,
  XrayController.getAllAbnormalities
);

/**
 * @swagger
 * /api/xrays/dicom/uploadMultiple:
 *   post:
 *     summary: Upload multiple DICOM X-ray files
 *     tags: [Xrays]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Multiple DICOM X-rays uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post(
  endPoint.uploadMultipleDicomXray,
  upload.array("files"),
  authMiddleware,
  XrayController.uploadMultipleDicomXray
);

/**
 * @swagger
 * /api/xrays/get/CommonAbnormalities:
 *   get:
 *     summary: Retrieve common abnormalities from X-rays
 *     tags: [Xrays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved common abnormalities
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get(
  endPoint.getCommonAbnormalities,
  authMiddleware,
  XrayController.getCommonAbnormalities
);

/**
 * @swagger
 * /api/xrays/get/XrayDay:
 *   get:
 *     summary: Retrieve X-rays taken on specific days
 *     tags: [Xrays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved X-rays by days
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get(endPoint.getXrayData, authMiddleware, XrayController.getXraybyDays);

/**
 * @swagger
 * /api/xrays/get/RecentXrays:
 *   get:
 *     summary: Retrieve recently uploaded X-rays
 *     tags: [Xrays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved recent X-rays
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get(
  endPoint.getRecentXrays,
  authMiddleware,
  XrayController.getRecentXrays
);

/**
 * @swagger
 * /edit:
 *   post:
 *     summary: Edit an X-ray
 *     tags: [Xrays]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               data:
 *                 type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: X-ray edited successfully
 *       400:
 *         description: Bad request
 */
router.post(endPoint.editXray, authMiddleware, XrayController.editXray);

router.get(
  endPoint.getAbnormalityByGender,
  authMiddleware,
  XrayController.getAbnormalityByGender
);

router.get(
  endPoint.getAbnormalityByAge,
  authMiddleware,
  XrayController.getAbnormalityByAge
);

router.get(
  endPoint.getAbnormalityByLocation,
  authMiddleware,
  XrayController.getAbnormalityByLocation
);

router.get(
  endPoint.getNormalAbnormalXrays,
  authMiddleware,
  XrayController.getNormalAbnormalXrays
);

router.put(
  endPoint.updateXrayBySlug,
  authMiddleware,
  XrayController.uploadMiddleware,
  XrayController.updateXrayBySlug
);

router.post(
  endPoint.uploadMetaDataDicom,
  upload.single("dicomFile"),
  authMiddleware,
  XrayController.uploadMetaDataDicom
)


router.get(
  endPoint.getHeatMapLink,
  authMiddleware,
  XrayController.getHeatMapLink
)


module.exports = router;
