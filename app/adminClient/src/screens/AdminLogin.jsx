import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../utils/config";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {

      const res = await axios.post(`${config.API_URL}/admin/login`, formData);
      if (res.data.mfaRequired) {
        setStep(2);
      } else if (res.data.token) {
        toast.success("Login successful!");
        if (res.data.token) {
          sessionStorage.setItem("adminToken", res.data.token);
        }
        navigate("/admin-dashboard");
      }
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^\d$/.test(value) || value === "") {
      const updated = [...otp];
      updated[index] = value;
      setOtp(updated);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${config.API_URL}/admin/verify-mfa`, {
        token: otp.join("")
      });
      toast.success("MFA verified!");
      if (res.data.token) {
        sessionStorage.setItem("adminToken", res.data.token);
      }
      navigate("/admin-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "MFA verification failed");
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
          Admin Login
        </h2>

        {step === 1 && (
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
            />
            <button
            type="submit"
            className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
          >
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20"></div>
            </div>
            <span className="mr-4 text-xl">Login</span>
          </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-gray-600">
              Enter the 6-digit MFA code
            </p>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
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
        )}
      </motion.div>
    </div>
  );
}
