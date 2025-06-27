const InferenceBox = require("../models/InferenceBox");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const tempSecrets = new Map();

exports.generatePaymentMFA = async (req, res) => {
  try {
    const { name, boxNo } = req.body;

    if (!name || !boxNo) {
      return res.status(400).json({ message: "Name and boxNo are required" });
    }

    const existingMfaBox = await InferenceBox.findOne({
      $or: [{ name }, { boxNo }],
      paymentMFAEnabled: true,
    });

    if (existingMfaBox) {
      return res.status(403).json({
        message:
          "This InferenceBox is already configured with MFA. Cannot generate another.",
      });
    }

    const secret = speakeasy.generateSecret({
      name: `RadioIQ Payment MFA (${boxNo})`,
    });

    const qrCodeURL = await qrcode.toDataURL(secret.otpauth_url);

    tempSecrets.set(boxNo, { secret: secret.base32, name });

    res.status(200).json({
      message: "Scan this QR to set up MFA",
      qrCodeURL,
    });
  } catch (error) {
    console.error("Error generating payment MFA:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.verifyPaymentMFA = async (req, res) => {
  try {
    const { boxNo, token } = req.body;

    if (!boxNo || !token) {
      return res.status(400).json({ message: "boxNo and token are required" });
    }

    const tempData = tempSecrets.get(boxNo);
    if (!tempData) {
      return res.status(404).json({ message: "MFA secret not found. Please generate QR again." });
    }

    const { secret, name } = tempData;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid or expired MFA token" });
    }

    const newBox = new InferenceBox({
      name,
      boxNo,
      paymentMFAToken: secret,
      paymentMFAEnabled: true,
    });

    await newBox.save();

    tempSecrets.delete(boxNo);

    res.status(200).json({ message: "Payment MFA setup successfully verified" });
  } catch (error) {
    console.error("Error verifying payment MFA:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.checkBoxConfigured = async (req, res) => {
  try {
    const box = await InferenceBox.findOne({ paymentMFAEnabled: true });
    res.send({ exists: !!box }); 
  } catch (error) {
    console.error("Verify MFA error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

