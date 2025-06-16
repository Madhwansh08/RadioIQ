import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
 
export default function AdminLogin({ setIsAuthenticated, fetchDoctors }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const [adminId, setAdminId] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
 
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/adminLogin`,
        { email, password },
        { withCredentials: true }
      );
 
      if (res.data.mfaRequired) {
        setAdminId(res.data.adminId);
        setStep(2);
        toast.info("MFA required: Enter your 6-digit code");
      } else {
        handleSuccess(res);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
 
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
 
  const handleSuccess = (res) => {
    const token = res.data.token;
    if (token) {
      sessionStorage.setItem("adminToken", token);
    }
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
      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };
 
  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && mfaToken[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
 
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-[100%] bg-[#fdfdfd] px-4">
      <motion.div
        className="text-center text-6xl w-full mb-24 font-bold text-[#5c60c6] mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Welcome to <span className="text-[#030811]">RadioIQ Admin Panel</span>
      </motion.div>
      <motion.form
        onSubmit={step === 1 ? handleLogin : handleMfaVerification}
        className="bg-white p-12 rounded-3xl shadow-lg w-full max-w-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center text-3xl  font-semibold text-black mb-10">
          Login Form
        </div>
 
        {step === 1 && (
          <>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-md bg-gray-50 dark:bg-[#1f1f3a] text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="mb-8">
              <label className="block mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-md bg-gray-50 dark:bg-[#1f1f3a] text-gray-900 dark:text-white"
                required
              />
            </div>
          </>
        )}
 
        {step === 2 && (
          <div className="mb-8">
            <label className="block mb-4 text-center text-lg font-medium dark:text-white">
              Enter 6-digit MFA Token
            </label>
            <div className="flex justify-center gap-3">
              {mfaToken.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-xl border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#1f1f3a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5c60c6]"
                />
              ))}
            </div>
          </div>
        )}
        <button
          type="submit"
          className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
        >
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20"></div>
          </div>
          <span className="mr-4 text-xl">
            {loading
              ? "Please wait..."
              : step === 1
              ? "Login"
              : "Verify MFA Token"}
          </span>
        </button>
      </motion.form>
    </div>
  );
}