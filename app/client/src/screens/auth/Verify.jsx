import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../utils/config";
import { toast } from "react-toastify";

const Verify = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [otpToken, setOtpToken] = useState(localStorage.getItem("otpToken") || "");

  // ✅ Ensure OTP Token is Present
  useEffect(() => {
    const storedToken = localStorage.getItem("otpToken");
    if (!storedToken) {
      toast.error("Please verify your email , Click on request otp");
      navigate("/verify");
    } else {
      setOtpToken(storedToken);
    }
  }, [navigate]);

  // ✅ Handle OTP Input
  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to the next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  // ✅ Handle Backspace Navigation
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // ✅ Handle OTP Verification
  const handleVerify = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      toast.error("Please enter all 6 digits of the OTP.");
      return;
    }

    if (!otpToken) {
      toast.error("OTP Token not found. Please request a new OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${config.API_URL}/api/auth/verify-verification-otp`,
        { otpToken, enteredOTP: enteredOtp },
        { withCredentials: true }
      );

      toast.success(response.data.message || "OTP Verified Successfully!");
      localStorage.removeItem("otpToken");
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid OTP. Please try again.";
      toast.error(errorMessage);

      if (errorMessage.includes("expired") || errorMessage.includes("Invalid or expired OTP token")) {
        localStorage.removeItem("otpToken");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Requesting a New OTP
  const requestNewOtp = async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${config.API_URL}/api/auth/request-verification-otp`,
        {},
        { withCredentials: true }
      );

      if (response.data.otpToken) {
        setOtpToken(response.data.otpToken);
        localStorage.setItem("otpToken", response.data.otpToken);
        toast.success("A new OTP has been sent to your email.");
      } else {
        toast.error("Failed to retrieve OTP Token.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request new OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center dark:bg-[#030811] bg-[#fdfdfd]">
      <h2 className="text-3xl font-semibold text-[#5c60c6] mb-4">Verify Your Email</h2>
      <p className="text-gray-500 mb-6">Please enter the 6-digit OTP sent to your email.</p>

      <div className="flex space-x-4 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="number"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c60c6]"
            maxLength="1"
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-40 py-3 mb-4 text-white bg-[#5c60c6] rounded-full hover:bg-[#4a4f9c] transition disabled:bg-gray-400"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <p className="text-gray-500">Didn’t receive the OTP?</p>
      <button
        onClick={requestNewOtp}
        disabled={loading}
        className="text-[#5c60c6] hover:underline mt-2 disabled:text-gray-400"
      >
        Request New OTP
      </button>
    </div>
  );
};

export default Verify;