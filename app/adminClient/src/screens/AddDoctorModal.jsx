import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../utils/config";
import { authHeader } from "../utils/authHeader";

export default function AddDoctorModal({ onClose, fetchDoctors }) {
  const [name, setName] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [docPassword, setDocPassword] = useState("");
  const [mfaModal, setMfaModal] = useState(false);

  const navigate = useNavigate();

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
      fetchDoctors();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Error adding doctor";
      onClose();
        toast.error(msg);
      
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
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
    </>
  );
}
