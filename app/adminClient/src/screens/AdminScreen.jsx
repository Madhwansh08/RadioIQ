import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../utils/config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLogin from "./AdminLogin";
import AdminRegister from "./AdminRegister";

export default function AdminScreen() {
  const [boxConfigured, setBoxConfigured] = useState(null);
  const [adminExists, setAdminExists] = useState(null);
  const [name, setName] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const boxRes = await axios.get(
          `${config.API_URL}/inference/check-box-configured`
        );
        console.log("Box Configured?", boxRes.data.exists);

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

    checkStatus();
  }, []);
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !boxNumber) {
      toast.error("Both fields are required");
      return;
    }

    sessionStorage.setItem("boxUserName", name);
    sessionStorage.setItem("boxNumber", boxNumber);
    toast.success("Details successfully saved");

    setTimeout(() => {
      navigate("/adminpayverification");
    }, 1000);
  };

  // Still loading
  if (boxConfigured === null || (boxConfigured && adminExists === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-xl">Checking system status...</p>
      </div>
    );
  }
  console.log(
    "Final state => boxConfigured:",
    boxConfigured,
    "adminExists:",
    adminExists
  );


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
      />

      {!boxConfigured ? (
        // Show Box Config Form
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Configure Box
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Box Number
              </label>
              <input
                type="text"
                value={boxNumber}
                onChange={(e) => setBoxNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Save
            </button>
          </form>
        </div>
      ) : adminExists ? (
        <AdminLogin />
      ) : (
        <AdminRegister />
      )}
    </div>
  );
}
