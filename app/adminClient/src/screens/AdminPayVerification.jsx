import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AdminPayVerification({onBoxConfigure}) {
  const [step, setStep] = useState(1);
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [mfaToken, setMfaToken] = useState(Array(6).fill(""));
  const [name, setName] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const inputRefs = useRef([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleBoxConfigure = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${config.API_URL}/inference/configure-inference-box`,
        { name, boxNo: boxNumber }
      );
      setQrCodeURL(res.data.qrCodeURL);
      setStep(2);
      toast.success("QR code generated. Scan it with your authenticator app.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to generate MFA QR");
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${config.API_URL}/inference/verify-inference-box-mfa`, {
        boxNo: boxNumber,
        token: mfaToken.join(""),
      });

      toast.success("Box MFA verified!");

      if (onBoxConfigure) onBoxConfigure();

      navigate("/");
    } catch (err) {
      setMessage(err.response?.data?.message || "MFA verification failed");
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value) || value === "") {
      const updatedOtp = [...mfaToken];
      updatedOtp[index] = value;
      setMfaToken(updatedOtp);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && mfaToken[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
        RadioIQ <span className="text-[#030811]">Box Setup</span>
      </motion.div>

      <motion.div
        className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-center text-3xl font-semibold text-[#030811] mb-6">
          Configure Box MFA
        </h2>

        {message && (
          <p className="text-center text-red-500 font-medium mb-4">{message}</p>
        )}

        {step === 1 && (
          <form onSubmit={handleBoxConfigure} className="space-y-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900 mb-4"
              placeholder="Enter box name"
              required
            />

            <input
              type="text"
              value={boxNumber}
              onChange={(e) => setBoxNumber(e.target.value)}
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
              placeholder="Enter box number"
              required
            />

            <button
              type="submit"
              className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20"></div>
              </div>
              <span className="mr-4 text-xl">Generate QR</span>
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
      </motion.div>
    </div>
  );
}
