import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../utils/config";

const AdminPaymentMFA = () => {
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const res = await axios.post(
          `${config.API_URL}/admin/initiateAdminMFA`
        );
        setQrCode(res.data.qrCodeURL);
      } catch (err) {
        console.error(err);
        setError("Failed to load QR code.");
      }
    };

    fetchQRCode();
  }, []);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(token)) {
      setError("Please enter a valid 6-digit token.");
      return;
    }

    try {
      const res = await axios.post(`${config.API_URL}/admin/verifyAdminMFA`, {
        token,
      });

      if (res.data.success) {
        setError("");
        navigate("/"); 
      } else {
        setError("Invalid or expired token.");
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-center mb-4">
        Scan Payment QR Code
      </h2>

      {qrCode ? (
        <img src={qrCode} alt="QR Code" className="mx-auto w-64 h-64 mb-4" />
      ) : (
        <p className="text-center text-gray-500">Loading QR code...</p>
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
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Verify
      </button>
    </div>
  );
};

export default AdminPaymentMFA;
