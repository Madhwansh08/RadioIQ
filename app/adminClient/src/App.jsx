import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminScreen from "./screens/AdminScreen";
import "react-toastify/dist/ReactToastify.css";
import AdminMFAVerification from "./screens/AdminMFAVerification";
import AdminPaymentMFA from "./screens/AdminPaymentMFA";
import AssignTokensFlow from "./screens/AssignTokensFlow";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<AdminScreen />} />
        <Route path="/payment-qrs" element={<AdminMFAVerification />} />
        <Route path="/admin-payment" element={<AdminPaymentMFA />} />
        <Route path="/assigntokenstoadmin" element={<AssignTokensFlow/>} />
      </Routes>
    </div>
  );
}
