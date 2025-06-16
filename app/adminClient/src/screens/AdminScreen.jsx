import React, { useState, useEffect } from "react";
import AdminLogin from "./AdminLogin";
import AdminRegister from "./AdminRegister";
import DoctorDashboard from "./DoctorDashboard";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from "../utils/config";
import { authHeader } from "../utils/authHeader";
 
export default function AdminScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminExists, setAdminExists] = useState(null); // null = unknown
  const [doctors, setDoctors] = useState([]);
 
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAuth = sessionStorage.getItem("isAuthenticated") === "true";
  
      try {
        // Always check backend for admin existence
        const res = await axios.get(`${config.API_URL}/admin/adminExists`);
        const exists = res.data.exists;
  
        sessionStorage.setItem("adminExists", exists);
        setAdminExists(exists);
  
        if (!exists) {
          // If admin no longer exists, force logout
          sessionStorage.removeItem("isAuthenticated");
          sessionStorage.removeItem("adminToken");
          setIsAuthenticated(false);
          setDoctors([]);
          return; // stop further checks
        }
  
        if (isAuth) {
          setIsAuthenticated(true);
          fetchDoctors();
        }
      } catch (err) {
        console.error("Admin existence check failed", err);
        toast.error("Error checking admin status");
      }
    };
  
    checkAdminStatus();
  }, []);
  
 
  const handleAdminRegistered = () => {
    console.log("Admin registered. Updating state.");
    sessionStorage.setItem("adminExists", "true");
    setAdminExists(true);
  };
  
  
  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/admin/doctors`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("adminToken")}`,
        },
      });
      
      setDoctors(response?.data?.doctors);
    } catch (error) {
      toast.error("Access denied or session expired");
      console.error("Error fetching doctors:", error);
    }
  };
 
  if (adminExists === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-xl">Checking system status...</p>
      </div>
    );
  }
 
  return (
    <div className="flex justify-center w-full min-h-screen">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar newestOnTop={true} />
 
      {(() => {
        if (!adminExists) {
          return <AdminRegister onRegisterSuccess={handleAdminRegistered} />;
        } else if (!isAuthenticated) {
          return (
            <AdminLogin
              setIsAuthenticated={setIsAuthenticated}
              fetchDoctors={fetchDoctors}
            />
          );
        } else {
          return (
            <DoctorDashboard
              doctors={doctors}
              fetchDoctors={fetchDoctors}
              setDoctors={setDoctors}
            />
          );
        }
      })()}
    </div>
  );
}