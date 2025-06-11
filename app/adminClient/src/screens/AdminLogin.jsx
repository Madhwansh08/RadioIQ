// AdminLogin.jsx
import React, { useState } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";

export default function AdminLogin({ setIsAuthenticated, fetchDoctors }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${config.API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const user = res.data.user;
      if (user.role !== "Admin") {
        toast.error("Unauthorized: Only Admins can access this panel");
        setLoading(false);
        return;
      }

      toast.success(res.data.message || "Login successful");
      sessionStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleLogin}
        className="bg-white p-12 rounded-3xl w-[600px] h-auto"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Admin Login</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            className="w-full px-3 py-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            className="w-full px-3 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
