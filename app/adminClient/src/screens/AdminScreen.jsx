// AdminScreen.jsx
import React, { useState, useEffect } from "react";
import AdminLogin from "./AdminLogin";
import DoctorDashboard from "./DoctorDashboard";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from "../utils/config";

export default function AdminScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const sessionStatus = sessionStorage.getItem("isAuthenticated");
    if (sessionStatus === "true") {
      setIsAuthenticated(true);
      fetchDoctors();
    }
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/admin/doctors`, {
        withCredentials: true,
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      toast.error("Access denied or session expired");
      console.error("Error fetching doctors:", error);
    }
  };

  return (
    <div className="flex justify-center w-full min-h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
      {!isAuthenticated ? (
        <AdminLogin
          setIsAuthenticated={setIsAuthenticated}
          fetchDoctors={fetchDoctors}
        />
      ) : (
        <DoctorDashboard
          doctors={doctors}
          fetchDoctors={fetchDoctors}
          setDoctors={setDoctors}
        />
      )}
    </div>
  );
}
