// DoctorDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";
import { authHeader } from "../utils/authHeader";
import { motion } from "framer-motion";

export default function DoctorDashboard({ doctors, fetchDoctors, setDoctors }) {
  const [show, setShow] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignTokensModal, setShowAssignTokensModal] = useState(false);
  const [showRemoveTokensModal, setShowRemoveTokensModal] = useState(false);
  const [adminTokens, setAdminTokens] = useState(0);
  const [doctor, setDoctor] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docPassword, setDocPassword] = useState("");

  const fetchAdminTokens = async () => {
    try {
      const response = await axios.get(
        `${config.API_URL}/admin/adminTokens`,
        authHeader()
      );
      const { tokens } = response.data;
      setAdminTokens(tokens);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error fetching admin tokens";
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchAdminTokens();
  }, []);

  const addDoctor = async () => {
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/doctors/add`,
        {
          name,
          email: docEmail,
          phoneNumber,
          password: docPassword,
        },
        authHeader()
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

  const verifyDoctor = async (id) => {
    try {
      await axios.patch(
        `${config.API_URL}/admin/doctors/${id}/verify`,
        {},
        authHeader()
      );
      toast.success("Doctor verified successfully");
      fetchDoctors();
    } catch (err) {
      toast.error("Error verifying doctor");
    }
  };

  const blockDoctor = async (id) => {
    try {
      await axios.patch(
        `${config.API_URL}/admin/doctors/${id}/block`,
        {},
        authHeader()
      );
      toast.success("Doctor blocked successfully");
      fetchDoctors();
    } catch (err) {
      toast.error("Error blocking doctor");
    }
  };

  const unblockDoctor = async (id) => {
    try {
      await axios.patch(
        `${config.API_URL}/admin/doctors/${id}/unblock`,
        {},
        authHeader()
      );
      toast.success("Doctor unblocked successfully");
      fetchDoctors();
    } catch (err) {
      toast.error("Error unblocking doctor");
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await axios.delete(`${config.API_URL}/admin/doctors/${id}`, authHeader());
      toast.success("Doctor deleted successfully");
      fetchDoctors();
    } catch (err) {
      toast.error("Error deleting doctor");
    }
  };

  const assignTokens = async (id, tokens) => {
    console.log("Assigning tokens:", id, tokens);
    try {
      await axios.post(
        `${config.API_URL}/admin/assignTokens/${id}`,
        { tokens },
        authHeader()
      );
      toast.success("Tokens assigned successfully");
      fetchDoctors();
      fetchAdminTokens();
    } catch (err) {
      const msg = err?.response?.data?.message || "Error assigning tokens";
      toast.error(msg);
    }
  };

  const removeTokens = async (id, tokens) => {
    console.log("Removing tokens:", id, tokens);
    try {
      await axios.post(
        `${config.API_URL}/admin/removeTokens/${id}`,
        { tokens },
        authHeader()
      );
      toast.success("Tokens removed successfully");
      fetchDoctors();
      fetchAdminTokens();
    } catch (err) {
      const msg = err?.response?.data?.message || "Error removing tokens";
      toast.error(msg);
    }
  };

  return (
    <div className="w-full mx-8 mt-16">
      <motion.div className="text-end text-2xl mb-8 text-[#5c60c6]">
        Total tokens : {adminTokens}
      </motion.div>
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold text-[#5c60c6]">Doctors List</h1>
        <button
          className="bg-[#5c60c6] text-white px-6 py-2 rounded hover:bg-[#030811] transition-all"
          onClick={() => setShow(true)}
        >
          Add Doctor
        </button>
      </motion.div>

      <motion.div
        className="overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <table className="min-w-full bg-white border border-gray-200 rounded shadow-md">
          <thead className="bg-[#f4f4f4]">
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Reset Code</th>
              <th className="border px-4 py-2">Tokens</th>
              <th className="border px-4 py-2">Assign Tokens</th>
              <th className="border px-4 py-2">Remove Tokens</th>
              <th className="border px-4 py-2">Verified</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
              <th className="border px-4 py-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {doctors?.map((doc) => (
              <tr key={doc._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{doc.name}</td>
                <td className="border px-4 py-2">{doc.email}</td>
                <td className="border px-4 py-2">{doc.phoneNumber}</td>
                <td className="border px-4 py-2">{doc.resetCode}</td>
                <td className="border px-4 py-2">{doc.tokens}</td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-[#5c60c6] text-white px-2 py-1 rounded hover:shadow-lg"
                    onClick={() => {
                      setDoctor(doc._id);
                      setShowAssignTokensModal(true);
                    }}
                  >
                    Assign Tokens
                  </button>
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-[#5c60c6] text-white px-2 py-1 rounded hover:shadow-lg"
                    onClick={() => {
                      setDoctor(doc._id);
                      setShowRemoveTokensModal(true);
                    }}
                  >
                    Remove Tokens
                  </button>
                </td>
                <td className="border px-4 py-2">
                  {doc.isVerified ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-sm rounded-full">
                      Verified
                    </span>
                  ) : (
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      onClick={() => verifyDoctor(doc._id)}
                    >
                      Verify
                    </button>
                  )}
                </td>
                <td className="border px-4 py-2">
                  {doc.isBlocked ? (
                    <span className="bg-red-100 text-red-800 px-2 py-1 text-sm rounded-full">
                      Blocked
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 text-sm rounded-full">
                      Active
                    </span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    onClick={() =>
                      doc.isBlocked
                        ? unblockDoctor(doc._id)
                        : blockDoctor(doc._id)
                    }
                  >
                    {doc.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    onClick={() => {
                      setDoctorToDelete(doc._id);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {show && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
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
                className="bg-[#5c60c6] text-white px-4 py-2 rounded hover:bg-[#030811]"
                onClick={addDoctor}
              >
                Add
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showDeleteModal && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete this doctor?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={async () => {
                  await deleteDoctor(doctorToDelete);
                  setShowDeleteModal(false);
                  setDoctorToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {showAssignTokensModal && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Tokens</h2>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded mb-4"
              placeholder="Enter tokens to assign"
              onChange={(e) => setTokens(e.target.value)}
              value={tokens}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowAssignTokensModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#5c60c6] text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={async () => {
                  if (!tokens || isNaN(tokens) || Number(tokens) <= 0) {
                    toast.error("Please enter a valid positive token number");
                    return;
                  }
                  await assignTokens(doctor, Number(tokens));
                  setShowAssignTokensModal(false);
                  setDoctor(null);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {showRemoveTokensModal && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Remove Tokens</h2>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded mb-4"
              placeholder="Enter tokens to assign"
              onChange={(e) => setTokens(e.target.value)}
              value={tokens}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowRemoveTokensModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#5c60c6] text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={async () => {
                  await removeTokens(doctor, Number(tokens));
                  setShowRemoveTokensModal(false);
                  setDoctor(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
