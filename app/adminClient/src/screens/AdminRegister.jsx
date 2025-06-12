import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";

const AdminRegister = ({ onRegisterSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [tempData, setTempData] = useState(null);
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [mfaToken, setMfaToken] = useState(Array(6).fill("")); // 6-digit OTP
  const inputRefs = useRef([]);
  const [message, setMessage] = useState("");

  // Step 1: Handle input
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Register + get MFA QR
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

  // Step 2: Verify MFA token
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
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setMessage(err.response?.data?.message || "MFA verification failed");
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value) || value === "") {
      const updatedOtp = [...mfaToken];
      updatedOtp[index] = value;
      setMfaToken(updatedOtp);

      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && mfaToken[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto h-[500px] mt-10 p-6 bg-white shadow-xl rounded-xl space-y-6 flex items-center justify-center">
      <div>
        <p className="text-4xl font-bold text-center text-[#5c60c6] mb-8">
          Admin Registration
        </p>

        {message && <div className="text-center text-2xl ">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              className="w-full p-2 border rounded"
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full p-2 border rounded"
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full p-2 border rounded"
              onChange={handleInputChange}
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
          <div className="space-y-4">
            <p className="text-center font-semibold text-gray-700 text-[#5c60c6]">
              Scan this QR code with Google/Microsoft Authenticator:
            </p>
            <div className="flex justify-center">
              <img src={qrCodeURL} alt="MFA QR Code" />
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
                    className="w-12 h-12 text-center text-lg border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <span data-testid="verify-otp-button" className="mr-4 text-xl">
                  Verify OTP 
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegister;
