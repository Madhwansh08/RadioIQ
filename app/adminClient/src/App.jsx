import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminScreen from "./screens/AdminScreen";
import "react-toastify/dist/ReactToastify.css";
import AdminMFAVerification from "./screens/AdminMFAVerification";
import AdminPaymentMFA from "./screens/AdminPaymentMFA";
import AssignTokensFlow from "./screens/AssignTokensFlow";
import AdminPayVerification from "./screens/AdminPayVerification";
import AdminRegister from "./screens/AdminRegister";
import AdminLogin from "./screens/AdminLogin";
import AdminDashboard from "./screens/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoutes";


export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<AdminScreen />} />
        <Route path="/payment-qrs" element={<AdminMFAVerification />} />
        <Route path="/admin-payment" element={<AdminPaymentMFA />} />
        <Route path="/assigntokenstoadmin" element={<AssignTokensFlow />} />
        <Route
          path="/adminpayverification"
          element={<AdminPayVerification />}
        />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
