import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";

export default function AdminLogin({ setIsAuthenticated, fetchDoctors }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState(Array(6).fill("")); // 6 digits
  const inputRefs = useRef([]);
  const [adminId, setAdminId] = useState(null);
  const [step, setStep] = useState(1); // 1 = credentials, 2 = MFA
  const [loading, setLoading] = useState(false);

  // Step 1: Submit email/password
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/adminLogin`,
        { email, password },
        { withCredentials: true }
      );

      // MFA required
      if (res.data.mfaRequired) {
        setAdminId(res.data.adminId);
        setStep(2); // show MFA input
        toast.info("MFA required: Enter your 6-digit code");
      } else {
        // fallback (if MFA not required — should rarely happen)
        handleSuccess(res);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit MFA token
  const handleMfaVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/adminVerifyMfa`,
        { adminId, token: mfaToken.join("") },
        { withCredentials: true }
      );
      handleSuccess(res);
    } catch (error) {
      toast.error(error.response?.data?.message || "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Final success handler
  const handleSuccess = (res) => {
    toast.success(res.data.message || "Login successful");
    sessionStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
    fetchDoctors();
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value) || value === "") {
      const updatedOtp = [...mfaToken];
      updatedOtp[index] = value;
      setMfaToken(updatedOtp);

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
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={step === 1 ? handleLogin : handleMfaVerification}
        className="bg-white p-12 rounded-3xl w-[600px] h-auto"
      >
        <h2 className="text-4xl font-bold mb-8 text-center text-[#5c60c6]">
          Admin Login
        </h2>

        {step === 1 && (
          <>
            <div className="mb-4">
              <label className="block mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="mb-6">
            <label className="block mb-3 text-center text-lg font-medium">
              Enter 6-digit MFA Token
            </label>
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
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : step === 1
            ? "Login"
            : "Verify MFA Token"}
        </button>
      </form>
    </div>
  );
}
