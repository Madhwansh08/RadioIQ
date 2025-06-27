import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminScreen from "./screens/AdminScreen";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminMFAStepper from "./screens/AdminMFAStepper";
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
      <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar
              newestOnTop
            />
      <Routes>
        <Route path="/" element={<AdminScreen />} />
        <Route path="/adminmfasetup" element={<AdminMFAStepper />} />
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
