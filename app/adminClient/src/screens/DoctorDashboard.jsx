// DoctorDashboard.jsx
import React, { useState } from "react";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";

export default function DoctorDashboard({ doctors, fetchDoctors, setDoctors }) {
  const [show, setShow] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docPassword, setDocPassword] = useState("");

  const addDoctor = async () => {
    try {
      const res = await axios.post(
        `${config.API_URL}/admin/doctors/add`,
        { name, email: docEmail, phoneNumber, password: docPassword },
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

  const verifyDoctor = async (id) => {
    try {
      await axios.patch(
        `${config.API_URL}/admin/doctors/${id}/verify`,
        {},
        { withCredentials: true }
      );
      toast.success("Doctor verified successfully");
      fetchDoctors();
    } catch (err) {
      console.error("Error verifying doctor:", err);
      toast.error("Error verifying doctor");
    }
  };

  const blockDoctor = async (id) => {
    try {
      await axios.patch(
        `${config.API_URL}/admin/doctors/${id}/block`,
        {},
        { withCredentials: true }
      );
      toast.success("Doctor blocked successfully");
      fetchDoctors();
    } catch (err) {
      console.error("Error blocking doctor:", err);
      toast.error("Error blocking doctor");
    }
  };

  const unblockDoctor = async (id) => {
    try {
      await axios.patch(
        `${config.API_URL}/admin/doctors/${id}/unblock`,
        {},
        { withCredentials: true }
      );
      toast.success("Doctor unblocked successfully");
      fetchDoctors();
    } catch (err) {
      console.error("Error unblocking doctor:", err);
      toast.error("Error unblocking doctor");
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await axios.delete(`${config.API_URL}/admin/doctors/${id}`, {
        withCredentials: true,
      });
      toast.success("Doctor deleted successfully");
      fetchDoctors();
    } catch (err) {
      console.error("Error deleting doctor:", err);
      toast.error("Error deleting doctor");
    }
  };

  return (
    <div className="w-full mx-8 mt-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-5xl font-bold">Doctors List</h1>
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
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Reset Code</th>
              <th className="border px-4 py-2">Verified</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
              <th className="border px-4 py-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc._id}>
                <td className="border px-4 py-2">{doc.name}</td>
                <td className="border px-4 py-2">{doc.email}</td>
                <td className="border px-4 py-2">{doc.phoneNumber}</td>
                <td className="border px-4 py-2">{doc.resetCode}</td>
                <td className="border px-4 py-2">
                  {doc.isVerified ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-sm rounded-full">
                      Verified
                    </span>
                  ) : (
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded"
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
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
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
                    className="bg-red-500 text-white px-2 py-1 rounded"
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
      </div>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
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
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={addDoctor}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
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
                className="bg-red-600 text-white px-4 py-2 rounded"
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
        </div>
      )}
    </div>
  );
}
