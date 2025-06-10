import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docPassword, setDocPassword] = useState("");
  const [show, setShow] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:7000/admin/doctors", {
        withCredentials: true,
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      toast.error("Access denied or session expired");
      console.error("Error fetching doctors:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:7000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Login successful");
      setIsAuthenticated(true);
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const addDoctor = async () => {
    try {
      const res = await axios.post(
        "http://localhost:7000/admin/doctors/add",
        {
          name,
          email: docEmail,
          phoneNumber,
          password: docPassword,
        },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Doctor added successfully");
      setShow(false);
      fetchDoctors();
      setName("");
      setPhoneNumber("");
      setDocEmail("");
      setDocPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding doctor");
    }
  };

  const verifyDoctor = async (doctorId) => {
    try {
      const res = await axios.patch(
        `http://localhost:7000/admin/doctors/${doctorId}/verify`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data.message || "Doctor verified successfully");
      fetchDoctors();
    } catch (error) {
      toast.error("Error verifying doctor");
      console.error("Error verifying doctor:", error);
    }
  };

  const blockDoctor = async (doctorId) => {
    try {
      const res = await axios.patch(
        `http://localhost:7000/admin/doctors/${doctorId}/block`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data.message || "Doctor blocked successfully");
      fetchDoctors();
    } catch (error) {
      toast.error("Error blocking doctor");
      console.error("Error blocking doctor:", error);
    }
  };

  const deleteDoctor = async (doctorId) => {
    try {
      const res = await axios.delete(
        `http://localhost:7000/admin/doctors/${doctorId}`,
        {
          withCredentials: true,
        }
      );
      toast.success(res.data.message || "Doctor deleted successfully");
      fetchDoctors();
    } catch (error) {
      toast.error("Error deleting doctor");
      console.error("Error deleting doctor:", error);
    }
  };

  return (
    <div className="p-8 flex items-center justify-center w-full h-full]">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      {!isAuthenticated ? (
        <div className="flex items-center justify-center min-h-screen">
          <form
            onSubmit={handleLogin}
            className="bg-white p-6 rounded shadow-md w-full max-w-md"
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
      ) : (
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Doctors List</h1>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setShow(true)}
            >
              Add Doctor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Phone Number</th>
                  <th className="border px-4 py-2">Reset Code</th>
                  <th className="border px-4 py-2">Verified</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(doctors) &&
                  doctors.map((doctor) => (
                    <tr key={doctor._id}>
                      <td className="border px-4 py-2">{doctor.name}</td>
                      <td className="border px-4 py-2">{doctor.email}</td>
                      <td className="border px-4 py-2">{doctor.phoneNumber}</td>
                      <td className="border px-4 py-2">{doctor.resetCode}</td>
                      <td className="border px-4 py-2">
                        {doctor.isVerified ? "Yes" : "No"}
                      </td>
                      <td className="border px-4 py-2 space-x-2">
                        {!doctor.isVerified ? (
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded"
                            onClick={() => verifyDoctor(doctor._id)}
                          >
                            Verify
                          </button>
                        ) : (
                          <>
                            <button
                              className="bg-yellow-500 text-white px-2 py-1 rounded"
                              onClick={() => blockDoctor(doctor._id)}
                            >
                              Block
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded"
                              onClick={() => deleteDoctor(doctor._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {show && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Doctor</h2>
                <div className="mb-4">
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded"
                    value={docPassword}
                    onChange={(e) => setDocPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={() => setShow(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={addDoctor}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
