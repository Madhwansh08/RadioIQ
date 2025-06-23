import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../utils/config";

const AdminMFAStepper = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentToken, setCurrentToken] = useState("");
  const [error, setError] = useState("");
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchQRCodes = async () => {
      try {
        const res = await axios.post(
          `${config.API_URL}/admin/initiateAdminTokenMFA`,
        );
        setQrCodes(res.data.qrCodes);
      } catch (err) {
        console.error(err);
        setError("Failed to load QR codes.");
      }
    };

    fetchQRCodes();
  }, []);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(currentToken)) {
      setError("Please enter a valid 6-digit token.");
      return;
    }

    try {
      const res = await axios.post(
        `${config.API_URL}/admin/verifySingleAdminMFAToken`,
        {
          token: currentToken,
          index: currentIndex,
        }
      );

      if (res.data.message.includes("verified")) {
        const next = currentIndex + 1;
        setVerifiedCount(verifiedCount + 1);
        setCurrentToken("");
        setError("");

        if (next === 5) {
          setCompleted(true);
        } else {
          setCurrentIndex(next);
        }
      } else {
        setError("Token incorrect. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed.");
    }
  };

  if (completed) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          ✅ MFA Complete!
        </h2>
        <p>You are now being redirected to the dashboard...</p>
        {/* Replace below with router redirect like navigate("/dashboard") if needed */}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-center mb-4">
        Scan MFA QR Code {currentIndex + 1} of 5
      </h2>

      {qrCodes.length > 0 ? (
        <img
          src={qrCodes[currentIndex]}
          alt={`QR ${currentIndex + 1}`}
          className="mx-auto w-64 h-64 mb-4"
        />
      ) : (
        <p className="text-center text-gray-500">Loading QR codes...</p>
      )}

      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={currentToken}
        onChange={(e) => setCurrentToken(e.target.value)}
        maxLength={6}
        className="w-full px-4 py-2 border rounded text-center text-lg mb-2"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <button
        onClick={handleVerify}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Verify & Continue
      </button>

      <p className="text-center text-sm text-gray-500 mt-3">
        Verified: {verifiedCount}/5
      </p>
    </div>
  );
};

export default AdminMFAStepper;
