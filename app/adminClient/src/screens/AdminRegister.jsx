import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const AdminRegister = ({ onRegisterSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [tempData, setTempData] = useState(null);
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [mfaToken, setMfaToken] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const [message, setMessage] = useState("");
  
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const res = await axios.post(`${config.API_URL}/admin/initiateAdminMFA`);
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
        setVerified(true);
        setError("");
      } else {
        setError("Invalid or expired token.");
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed.");
    }
  };




  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/adminInitRegister`,
        formData
      );
      setQrCodeURL(res.data.qrCodeURL);
      setTempData(res.data.tempData);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/adminCompleteRegister`,
        {
          ...tempData,
          token: mfaToken.join(""),
        }
      );
      toast.success("Admin registered successfully!");
      setStep(3);
    } catch (err) {
      setMessage(err.response?.data?.message || "MFA verification failed");
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value) || value === "") {
      const updatedOtp = [...mfaToken];
      updatedOtp[index] = value;
      setMfaToken(updatedOtp);
      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && mfaToken[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#fdfdfd] px-4">
      <motion.div
        className="text-center text-5xl md:text-6xl font-bold text-[#5c60c6] mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome to <span className="text-[#030811]">RadioIQ Admin Panel</span>
      </motion.div>

      <motion.div
        className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-center text-3xl font-semibold text-[#030811] mb-6">
          Admin Registration
        </h2>

        {message && (
          <p className="text-center text-red-500 font-medium mb-4">{message}</p>
        )}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-5">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
            />
            <button
              type="submit"
              className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20"></div>
              </div>
              <span className="mr-4 text-xl">Register</span>
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-center font-medium text-[#5c60c6]">
              Scan this QR code with your Authenticator App:
            </p>
            <div className="flex justify-center">
              <img src={qrCodeURL} alt="MFA QR Code" className="max-w-xs" />
            </div>
            <form onSubmit={handleMfaVerification} className="space-y-6">
              <div className="flex justify-center gap-2">
                {mfaToken.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#5c60c6]"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20"></div>
                </div>
                <span className="mr-4 text-xl">Verify OTP</span>
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4">
              Scan Payment QR Code
            </h2>

            {qrCode ? (
              <img
                src={qrCode}
                alt="QR Code"
                className="mx-auto w-64 h-64 mb-4"
              />
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
        )}
      </motion.div>
    </div>
  );
};

export default AdminRegister;
