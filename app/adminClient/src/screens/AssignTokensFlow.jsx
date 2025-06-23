import React, { useState } from "react";
import axios from "axios";
import { authHeader } from "../utils/authHeader";
import config from "../utils/config";

export default function AssignTokensFlow() {
  const [step, setStep] = useState(1);
  const [paymentToken, setPaymentToken] = useState("");
  const [tierToken, setTierToken] = useState("");
  const [tier, setTier] = useState(1);
  const [message, setMessage] = useState("");

  const verifyPayment = async () => {
    try {
      await axios.post(
        `${config.API_URL}/admin/verify-payment-token`,
        { paymentToken },
        authHeader()
      );
      setStep(2);
      setMessage("Payment OTP verified. Now enter Tier OTP.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error verifying payment OTP.");
    }
  };

  const assignTokens = async () => {
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/assign-tokens-after-mfa`,
        {
          tier,
          tierToken,
        },
        authHeader()
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error assigning tokens.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Admin Token Assignment</h2>

      {step === 1 && (
        <>
          <label>Payment OTP:</label>
          <input
            type="text"
            value={paymentToken}
            onChange={(e) => setPaymentToken(e.target.value)}
            className="input input-bordered w-full mb-2"
          />
          <button onClick={verifyPayment} className="btn btn-primary w-full">
            Verify Payment OTP
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <label>Select Tier:</label>
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value))}
            className="select w-full mb-2"
          >
            <option value={1}>Tier 1 - 5K</option>
            <option value={2}>Tier 2 - 10K</option>
            <option value={3}>Tier 3 - 25K</option>
            <option value={4}>Tier 4 - 50K</option>
            <option value={5}>Tier 5 - 100K</option>
          </select>

          <label>Tier OTP:</label>
          <input
            type="text"
            value={tierToken}
            onChange={(e) => setTierToken(e.target.value)}
            className="input input-bordered w-full mb-2"
          />
          <button onClick={assignTokens} className="btn btn-success w-full">
            Verify Tier OTP & Assign Tokens
          </button>
        </>
      )}

      {message && (
        <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}
