const express = require("express");
const router = express.Router();
const InferenceBoxController = require("../controllers/inferenceBoxController");

router.post(
  "/configure-inference-box",
  InferenceBoxController.generatePaymentMFA
);

router.post(
  "/verify-inference-box-mfa",
  InferenceBoxController.verifyPaymentMFA
);

router.get(
    "/check-box-configured",
    InferenceBoxController.checkBoxConfigured
)

module.exports = router;