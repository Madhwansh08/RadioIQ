const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authMiddleware } = require("./../middleware/authMiddleware");
const upload = require("../config/multer");
const endPoint = require("../endPoints.js");
 
/**
* @swagger
* /api/auth/register:
*   post:
*     summary: Register a new doctor
*     tags: [Auth]
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
*               password:
*                 type: string
*               phoneNumber:
*                 type: string
*     responses:
*       200:
*         description: Doctor registered successfully
*       400:
*         description: Bad request
*/
router.post(endPoint.register, AuthController.registerDoctor);
 
/**
* @swagger
* /api/auth/login:
*   post:
*     summary: Login a doctor
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               email:
*                 type: string
*               password:
*                 type: string
*     responses:
*       200:
*         description: Doctor logged in successfully
*       400: 
*         description: Bad request
*/
router.post(endPoint.login, AuthController.loginDoctor);
 
router.post("/loginById/:doctorId", AuthController.loginDoctorByID);

router.get("/tokens", authMiddleware, AuthController.getDoctorTokens);
 
router.get("/getAllDoctorsPublic", AuthController.getAllDoctorsPublic);
 
router.put(endPoint.updateDoctor, authMiddleware, AuthController.updateDoctor);
 
/**
* @swagger
* /api/auth/request-password-reset:
*   post:
*     summary: Request a password reset
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               email:
*                 type: string
*     responses:
*       200:
*         description: Password reset requested successfully
*       400:
*         description: Bad request
*/
// router.post(endPoint.requestPasswordReset, AuthController.requestPasswordReset);
 
/**
* @swagger
* /api/auth/verify-otp:
*   post:
*     summary: Verify OTP
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               email:
*                 type: string
*               otp:
*                 type: string
*     responses:
*       200:
*         description: OTP verified successfully
*       400:
*         description: Bad request
*/
// router.post(endPoint.verifyOTP, AuthController.verifyOTP);
 
/**
* @swagger
* /api/auth/reset-password:
*   post:
*     summary: Reset password
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               email:
*                 type: string
*               newPassword:
*                 type: string
*     responses:
*       200:
*         description: Password reset successfully
*       400:
*         description: Bad request
*/
router.post(endPoint.resetPassword, AuthController.resetPassword);
 
router.get(endPoint.logout, AuthController.logoutDoctor);
 
/**
* @swagger
* /api/auth/user-auth:
*   get:
*     summary: Check user authentication
*     tags: [Auth]
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: User authenticated successfully
*       401:
*         description: Unauthorized
*/
// routes/authRoutes.js (or similar)
router.get(endPoint.userAuth, authMiddleware, (req, res) => {
  // Remove sensitive fields like password before sending user data
  const { password, ...doctorData } = req.doctor.toObject();
  res.status(200).json({ ok: true, user: doctorData });
});
 
/**
* @swagger
* /api/auth/upload-profile-picture:
*   post:
*     summary: Upload a profile picture
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         multipart/form-data:
*           schema:
*             type: object
*             properties:
*               profilePicture:
*                 type: string
*                 format: binary
*     responses:
*       200:
*         description: Profile picture uploaded successfully
*       400:
*         description: Bad request
*/
router.post(
  endPoint.uploadProfilePicture,
  authMiddleware,
  upload.single("profilePicture"),
  AuthController.uploadProfilePicture
);
 
router.get(
  endPoint.getProfilePicture,
  authMiddleware,
  AuthController.getProfilePicture
);
 
router.get(endPoint.getDoctor, authMiddleware, AuthController.getDoctorDetails);
 
router.post(endPoint.secureRegister, AuthController.requestRegistrationOTP);
 
router.post(
  endPoint.verifyRegistrationOTP,
  AuthController.verifyRegistrationOTP
);
 
router.get(
  endPoint.getVerficationStatus,
  authMiddleware,
  AuthController.getVerificationStatus
);
 
router.post(
  endPoint.requestVerificationOTP,
  authMiddleware,
  AuthController.requestVerificationOTP
);


 
router.post(
  endPoint.verifyVerificationOTP,
  authMiddleware,
  AuthController.verifyVerificationOTP
);
 
module.exports = router;
 
 