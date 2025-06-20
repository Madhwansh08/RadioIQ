import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminScreen from "./screens/AdminScreen";
import "react-toastify/dist/ReactToastify.css";
import AdminMFAVerification from "./screens/AdminMFAVerification";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<AdminScreen />} />
        <Route path="/admin5qr" element={<AdminMFAVerification />} />
      </Routes>
    </div>
  );
}
