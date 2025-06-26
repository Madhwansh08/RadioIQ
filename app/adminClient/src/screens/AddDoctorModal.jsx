import React, { useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function AddDoctorModal({ onClose, fetchDoctors }) {
  const [name, setName] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [docPassword, setDocPassword] = useState("");
  const [mfaModal, setMfaModal] = useState(false);

  const navigate = useNavigate();

  const addDoctor = async () => {
    try {
      const res = await axiosInstance.post("/admin/doctors/add", {
        name,
        email: docEmail,
        phoneNumber,
        password: docPassword,
      });
      toast.success(res.data.message || "Doctor added successfully");
      fetchDoctors();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Error adding doctor";

      if (error.response?.status === 403 && msg.toLowerCase().includes("mfa")) {
        setMfaModal(true); // show MFA setup modal
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Add Doctor</h2>
          {/* Form Fields */}
          {/* ... (name, email, phone, password) */}
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

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded"
              onClick={onClose}
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
      </div>

      {/* MFA Modal */}
      {mfaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm text-center">
            <h2 className="text-lg font-bold text-red-600 mb-4">
              MFA Not Enabled
            </h2>
            <p className="mb-6">
              You must enable Multi-Factor Authentication before performing this
              action.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setMfaModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                onClick={() => navigate("/adminmfasetup")}
              >
                Enable MFA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
