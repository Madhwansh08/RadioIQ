import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminScreen from "./screens/AdminScreen";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<AdminScreen />} />
      </Routes>
    </div>
  );
}
