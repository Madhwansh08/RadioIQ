import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import config from "../utils/config";

export default function AssignTokensFlow() {
  const [step, setStep] = useState(1);
  const [paymentToken, setPaymentToken] = useState("");
  const [tierToken, setTierToken] = useState("");
  const [tier, setTier] = useState(1);
  const [message, setMessage] = useState("");

  const goToPaymentStep = () => {
    setStep(2);
  };

  const verifyPayment = async () => {
    try {
      await axiosInstance.post(`${config.API_URL}/admin/verify-payment-token`, {
        paymentToken,
      });
      setStep(3);
      setMessage(
        "✅ Payment OTP verified. Now enter Tier OTP to assign tokens."
      );
    } catch (err) {
      setMessage(
        err.response?.data?.message || "❌ Error verifying payment OTP."
      );
    }
  };

  const assignTokens = async () => {
    try {
      const res = await axiosInstance.post(
        `${config.API_URL}/admin/assign-tokens-after-mfa`,
        { tier, tierToken }
      );
      setMessage(`✅ ${res.data.message} (New total: ${res.data.newTotal})`);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error assigning tokens.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-5/6 p-96 h-5/6 bg-white rounded-2xl shadow-xl space-y-6">
        <h2 className="text-5xl font-bold text-center text-gray-800">
           Admin Token Assignment
        </h2>

        {step === 1 && (
          <div className="space-y-6 text-center">
            <p className="text-xl text-orange-400">
              <strong>Important:</strong> Please{" "}
              <span className="font-semibold">call the IT team</span> before
              continuing.
            </p>
            <button
              onClick={goToPaymentStep}
              className="w-2/6 py-3 px-6 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              I'm in the call with them, proceed
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <label className="block text-lg font-medium text-gray-700">
              Enter Payment OTP (from IT):
            </label>
            <input
              type="text"
              value={paymentToken}
              onChange={(e) => setPaymentToken(e.target.value)}
              className="w-full px-4 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 6-digit OTP"
            />
            <button
              onClick={verifyPayment}
              className="w-full py-3 px-6 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Verify Payment OTP
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <label className="block text-lg font-medium text-gray-700">
              Select Token Tier:
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(Number(e.target.value))}
              className="w-full px-4 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Tier 1 - 5K</option>
              <option value={2}>Tier 2 - 10K</option>
              <option value={3}>Tier 3 - 25K</option>
              <option value={4}>Tier 4 - 50K</option>
              <option value={5}>Tier 5 - 100K</option>
            </select>

            <label className="block text-lg font-medium text-gray-700">
              Enter Tier OTP (from IT):
            </label>
            <input
              type="text"
              value={tierToken}
              onChange={(e) => setTierToken(e.target.value)}
              className="w-full px-4 py-3 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter 6-digit OTP"
            />
            <button
              onClick={assignTokens}
              className="w-full py-3 px-6 text-lg rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
            >
              Verify Tier OTP & Assign Tokens
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 text-center text-md text-gray-800 bg-gray-100 p-4 rounded-lg border">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
