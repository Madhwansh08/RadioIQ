import React, { useState } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminRegister = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${config.API_URL}/admin/register`, formData);
      sessionStorage.setItem("adminExists", "true");
      toast.success("Admin registered successfully!");
      if (onRegisterSuccess) onRegisterSuccess();
      navigate("/admin-login");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#fdfdfd] px-4">
      <motion.div
        className="text-center text-5xl md:text-6xl font-bold text-[#5c60c6] mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome to <span className="text-[#030811]">RadioIQ Admin Panel</span>
      </motion.div>

      <motion.div
        className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-center text-3xl font-semibold text-[#030811] mb-6">
          Admin Registration
        </h2>

        {message && (
          <p className="text-center text-red-500 font-medium mb-4">{message}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-md bg-gray-50 text-gray-900"
          />
          <button
            type="submit"
            className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
          >
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20"></div>
            </div>
            <span className="mr-4 text-xl">Register</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminRegister;
