import React, { useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import config from "../utils/config";
import { useNavigate } from "react-router-dom";
import { authHeader } from "../utils/authHeader";

export default function AssignTokensFlow() {
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState(1);
  const navigate = useNavigate();

  const [paymentOtp, setPaymentOtp] = useState(Array(6).fill(""));
  const [tierOtp, setTierOtp] = useState(Array(6).fill(""));
  const paymentRefs = useRef([]);
  const tierRefs = useRef([]);

  const handleOtpChange = (otpArray, setOtp, refs) => (value, index) => {
    if (/^\d$/.test(value) || value === "") {
      const updated = [...otpArray];
      updated[index] = value;
      setOtp(updated);
      if (value && index < 5) refs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (otpArray, refs) => (e, index) => {
    if (e.key === "Backspace" && otpArray[index] === "" && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const goToPaymentStep = () => setStep(2);

  const verifyPayment = async () => {
    try {
      await axios.post(
        `${config.API_URL}/admin/verify-payment-token`,
        { paymentToken: paymentOtp.join("") },
        authHeader()
      );
      setStep(3);
      toast.success("✅ Payment OTP verified.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error verifying payment OTP."
      );
    }
  };

  const assignTokens = async () => {
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/assign-tokens-after-mfa`,
        { tier, tierToken: tierOtp.join("") },
        authHeader()
      );
      toast.success(`${res.data.message} (New total: ${res.data.newTotal})`);
      navigate("/admin-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error assigning tokens.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#fdfdfd] px-4">
      <motion.div
        className="text-center text-5xl md:text-6xl font-bold text-[#5c60c6] mb-10"
      >
        Welcome to <span className="text-[#030811]">RadioIQ</span>
      </motion.div>
      <motion.div
        className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-xl"
      >
        <h2 className="text-center text-3xl font-semibold text-[#030811] mb-6">
          {step==2 && "Enter the Payment OTP"}
          {step==3 && "Select the Tier & enter the tier OTP"}
        </h2>

        {step === 1 && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg text-center space-y-6">
              <h3 className="text-3xl font-bold text-gray-800">
                ⚠️ Important
              </h3>
              <p className="text-2xl text-red-500">
                Please <span className="font-semibold">call the IT team</span>{" "}
                before continuing.
              </p>
             <div className="flex gap-2">
             <button
                onClick={goToPaymentStep}
                className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20"></div>
                </div>
                <span className="mr-4 text-xl">Proceed</span>
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-red-500 px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#ff0000]"
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20"></div>
                </div>
                <span className="mr-4 text-xl">Go Back</span>
              </button>
             </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {paymentOtp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(
                      paymentOtp,
                      setPaymentOtp,
                      paymentRefs
                    )(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handleOtpKeyDown(paymentOtp, paymentRefs)(e, index)
                  }
                  ref={(el) => (paymentRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#5c60c6]"
                />
              ))}
            </div>
            <button
              onClick={verifyPayment}
              className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20"></div>
              </div>
              <span className="mr-4 text-xl">Verify Payment OTP</span>
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <label className="block text-lg font-medium text-gray-700">
              Select Token Tier:
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#5c60c6] mb-4"
            >
              <option value={1}>5,000</option>
              <option value={2}>10,000</option>
              <option value={3}>20,000</option>
              <option value={4}>50,000</option>
              <option value={5}>1,00,000</option>
            </select>

            <label className="block text-lg font-medium text-gray-700">
              Tier OTP:
            </label>
            <div className="flex justify-center gap-2">
              {tierOtp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(
                      tierOtp,
                      setTierOtp,
                      tierRefs
                    )(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handleOtpKeyDown(tierOtp, tierRefs)(e, index)
                  }
                  ref={(el) => (tierRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#5c60c6]"
                />
              ))}
            </div>
            <button
              onClick={assignTokens}
              className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20"></div>
              </div>
              <span className="mr-4 text-xl">
                Verify Tier OTP
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
