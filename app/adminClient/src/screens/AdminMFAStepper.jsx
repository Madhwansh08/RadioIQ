import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../utils/config";
import { useNavigate } from "react-router-dom";

const AdminMFAStepper = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const res = await axios.post(
          `${config.API_URL}/admin/setup-mfa`,
          {},
        );
        setQrCodeUrl(res.data.qrCodeURL);
      } catch (err) {
        console.error(err);
        setError("Failed to generate QR code.");
      }
    };

    generateQRCode();
  }, []);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(token)) {
      setError("Please enter a valid 6-digit token.");
      return;
    }

    try {
      const res = await axios.post(
        `${config.API_URL}/admin/verify-mfa-setup`,
        { token },
      );

      if (res.data.message.includes("completed")) {
        setSuccess(true);
        navigate("/admin-dashboard");
      } else {
        setError("Invalid OTP. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "MFA verification failed. Try again."
      );
    }
  };


  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg text-center">
      <h2 className="text-xl font-bold mb-4">
        Set Up Multi-Factor Authentication
      </h2>

      {qrCodeUrl ? (
        <>
          <img
            src={qrCodeUrl}
            alt="MFA QR Code"
            className="mx-auto w-64 h-64 mb-4"
          />
          <p className="text-sm text-gray-600 mb-4">
            Scan this QR code with your authenticator app
          </p>
        </>
      ) : (
        <p className="text-gray-500 mb-4">Loading QR Code...</p>
      )}

      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        maxLength={6}
        className="w-full px-4 py-2 border rounded text-center text-lg mb-2"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <button
        onClick={handleVerify}
        className="w-full bg-[#5c60c6] text-white py-2 rounded hover:bg-[#030811] transition"
      >
        Verify & Enable MFA
      </button>
    </div>
  );
};

export default AdminMFAStepper;
