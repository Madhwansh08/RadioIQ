import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLogin from "./AdminLogin";
import AdminRegister from "./AdminRegister";
import AdminPayVerification from "./AdminPayVerification";

export default function AdminScreen() {
  const [boxConfigured, setBoxConfigured] = useState(null);
  const [adminExists, setAdminExists] = useState(false);

  const checkStatus = async () => {
    try {
      const boxRes = await axios.get(
        `${config.API_URL}/inference/check-box-configured`
      );
      const boxExists = boxRes.data.exists === true;
      sessionStorage.setItem("boxConfigured", JSON.stringify(boxExists));
      setBoxConfigured(boxExists);

      if (boxExists) {
        const adminRes = await axios.get(
          `${config.API_URL}/admin/adminExists`
        );
        const exists = adminRes.data.exists === true;
        sessionStorage.setItem("adminExists", JSON.stringify(exists));
        setAdminExists(exists);
      }
    } catch (err) {
      console.error("Error checking status:", err);
      toast.error("Failed to verify system status");
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleBoxConfigured = async () => {
    await checkStatus();
  };

  if (boxConfigured === null || (boxConfigured && adminExists === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-xl">Checking system status...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      

      {(() => {
        if (!boxConfigured) {
          return <AdminPayVerification onBoxConfigure={handleBoxConfigured} />;
        } else if (adminExists) {
          return <AdminLogin />;
        } else {
          return <AdminRegister />;
        }
      })()}
    </div>
  );
}

