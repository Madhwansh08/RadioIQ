import React, { useState, useRef } from "react";
import axios from "axios";
import config from "../utils/config";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [tempToken, setTempToken] = useState(null);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("✅Submitting form data:", formData);
      const res = await axios.post(`${config.API_URL}/admin/login`, formData);
      

      if (res.data.mfaRequired) {
        setTempToken(res.data.tempToken);
        setStep(2);
      } else if (res.data.token) {
        toast.success("Login successful!");
        if (res.data.token) {
          localStorage.setItem("adminToken", res.data.token);
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
      const res = await axiosInstance.post(`/admin/verify-mfa`, {
        token: tempToken,
        otp: otp.join(""),
      });
      

      toast.success("MFA verified!");
      if (res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
      }
      navigate("/admin-dashboard");

    } catch (err) {
      toast.error(err.response?.data?.message || "MFA verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Admin Login
        </h2>

        {step === 1 && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Login
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
                  className="w-12 h-12 text-center border rounded-md text-xl"
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
            >
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
