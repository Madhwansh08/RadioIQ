import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import axiosInstance from "../utils/axiosInstance";
import AddDoctorModal from "./AddDoctorModal";
import config from "../utils/config";

export default function AdminDashboard() {
  const [show, setShow] = useState(false);
  const [adminTokens, setAdminTokens] = useState(0);
  const [doctors, setDoctors] = useState(null);
  const [removePopupDoctorId, setRemovePopupDoctorId] = useState(null);
  const [tokensToRemove, setTokensToRemove] = useState("");
  const [tierPopupDoctorId, setTierPopupDoctorId] = useState(null);
  const [selectedTier, setSelectedTier] = useState(0);  
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();
  const mfaEnabled = admin?.mfaEnabled === true || admin?.mfaEnabled === "true";




  const fetchDoctors = async () => {
    try {
      const res = await axiosInstance.get("/admin/doctors");
      setDoctors(res.data.doctors); 
    } catch (err) {
      toast.error("Failed to fetch doctors");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);


  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    console.log("🔑 Token from localStorage:", token);
    if (!token) {
      navigate("/admin-login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setAdmin(decoded);

      // Fetch tokens only if MFA is enabled
      if (decoded?.mfaEnabled) {
        fetchAdminTokens();
      }
    } catch (err) {
      localStorage.removeItem("adminToken");
      navigate("/admin-login");
    }
  }, []);
  
  
  

  const fetchAdminTokens = async () => {
    try {
      const res = await axiosInstance.get("/admin/adminTokens");
      setAdminTokens(res.data.tokens);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Error fetching admin tokens"
      );
    }
  };

  // const addDoctor = async () => {
  //   try {
  //     const res = await axiosInstance.post("/admin/doctors/add", {
  //       name,
  //       email: docEmail,
  //       phoneNumber,
  //       password: docPassword,
  //     });
  //     toast.success(res.data.message || "Doctor added successfully");
  //     setShow(false);
  //     fetchDoctors();
  //     setName("");
  //     setPhoneNumber("");
  //     setDocEmail("");
  //     setDocPassword("");
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || "Error adding doctor");
  //   }
  // };

  const verifyDoctor = async (id) => {
    try {
      await axiosInstance.patch(`/admin/doctors/${id}/verify`);
      toast.success("Doctor verified successfully");
      fetchDoctors();
    } catch {
      toast.error("Error verifying doctor");
    }
  };

  const blockDoctor = async (id) => {
    try {
      await axiosInstance.patch(`/admin/doctors/${id}/block`);
      toast.success("Doctor blocked successfully");
      fetchDoctors();
    } catch {
      toast.error("Error blocking doctor");
    }
  };

  const unblockDoctor = async (id) => {
    try {
      await axiosInstance.patch(`/admin/doctors/${id}/unblock`);
      toast.success("Doctor unblocked successfully");
      fetchDoctors();
    } catch {
      toast.error("Error unblocking doctor");
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await axiosInstance.delete(`/admin/doctors/${id}`);
      toast.success("Doctor, patients, and XRAYs deleted successfully.");
      fetchDoctors(); 
      fetchAdminTokens(); 
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error deleting doctor");
    }
  };
  

  const assignTokens = async (id, tier) => {
    try {
      await axiosInstance.post(`/admin/assignTokens/${id}`, { tier });
      toast.success("Tokens assigned successfully");
      fetchDoctors();
      fetchAdminTokens();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error assigning tokens");
    }
  };

  const removeTokens = async (id, tokens) => {
    try {
      await axiosInstance.post(`/admin/removeTokens/${id}`, { tokens });
      toast.success("Tokens removed successfully");
      fetchDoctors();
      fetchAdminTokens();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error removing tokens");
    }
  };

  return (
    <div className="w-full px-4 md:px-8 mt-10 md:mt-16">
      {/* {!(admin?.mfaEnabled === true || admin?.mfaEnabled === "true") && (
        <motion.div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <p className="font-semibold text-base md:text-lg">
              MFA Not Configured
            </p>
            <p className="text-sm">
              Secure your account by setting up multi-factor authentication.
            </p>
          </div>
          <button
            onClick={() => navigate("/adminmfasetup")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition"
          >
            Configure MFA
          </button>
        </motion.div>
      )} */}

      <motion.div className="text-end text-lg md:text-2xl mb-6 text-[#5c60c6]">
        Total tokens : {adminTokens}
      </motion.div>

      <motion.div
        className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold text-[#5c60c6]">
          Doctors List
        </h1>
        <div className="flex gap-3 flex-wrap">
          <button
            className="bg-[#5c60c6] text-white px-4 py-2 rounded-md hover:bg-[#030811] transition"
            onClick={() => setShow(true)}
          >
            Add Doctor
          </button>
          <button
            className="bg-[#5c60c6] text-white px-4 py-2 rounded-md hover:bg-[#030811] transition"
            onClick={() => navigate("/assigntokenstoadmin")}
          >
            Add Tokens
          </button>
        </div>
      </motion.div>

      <motion.div
        className="overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-md text-sm md:text-base">
          <thead className="bg-[#f4f4f4]">
            <tr>
              {[
                "Name",
                "Email",
                "Phone",
                "Reset Code",
                "Tokens",
                "Assign Tokens",
                "Remove Tokens",
                "Verified",
                "Status",
                "Actions",
                "Delete",
              ].map((heading) => (
                <th
                  key={heading}
                  className="border px-4 py-2 text-left font-medium"
                >
                  {heading}
                </th>
              ))}
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
                    className="bg-[#5c60c6] text-white px-3 py-1 rounded hover:shadow-lg"
                    onClick={() => {
                      setTierPopupDoctorId(doc._id);
                      setSelectedTier(0);
                    }}
                  >
                    Assign
                  </button>

                  {/* Centered popup */}
                  {tierPopupDoctorId === doc._id && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                      <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-10 w-96">
                        <p className="text-3xl font-semibold mb-11 text-center">
                          Assign Token Tier
                        </p>

                        <select
                          className="w-full px-3 py-2 border rounded mb-7"
                          value={selectedTier}
                          onChange={(e) =>
                            setSelectedTier(Number(e.target.value))
                          }
                        >
                          <option value={0}>Select Tier</option>
                          <option value={1}>Tier 1 (1000 tokens)</option>
                          <option value={2}>Tier 2 (2000 tokens)</option>
                          <option value={3}>Tier 3 (3000 tokens)</option>
                        </select>

                        <div className="flex justify-between items-center">
                          <button
                            className="bg-[#5c60c6] text-white text-lg px-5 py-1 rounded hover:bg-[#4447b3] transition"
                            onClick={() => {
                              if (![1, 2, 3].includes(selectedTier)) {
                                toast.error("Please select a valid tier");
                                return;
                              }
                              assignTokens(doc._id, selectedTier);
                              setTierPopupDoctorId(null);
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="text-lg font-semibold text-gray-900 hover:text-gray-700"
                            onClick={() => setTierPopupDoctorId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>

                <td className="border px-4 py-2">
                  <button
                    className="bg-[#5c60c6] text-white px-3 py-1 rounded hover:shadow-lg"
                    onClick={() => {
                      setRemovePopupDoctorId(doc._id);
                      setTokensToRemove("");
                    }}
                  >
                    Remove
                  </button>

                  {/* Centered popup for removing tokens */}
                  {removePopupDoctorId === doc._id && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                      <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-10 w-96">
                        <p className="text-3xl font-semibold mb-11 text-center">
                          Remove Tokens
                        </p>

                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded mb-7"
                          placeholder="Enter number of tokens to remove"
                          value={tokensToRemove}
                          onChange={(e) => setTokensToRemove(e.target.value)}
                        />

                        <div className="flex justify-between items-center">
                          <button
                            className="bg-[#5c60c6] text-white text-lg px-5 py-1 rounded hover:bg-[#4447b3] transition"
                            onClick={() => {
                              const amount = Number(tokensToRemove);
                              if (!amount || isNaN(amount) || amount <= 0) {
                                toast.error("Enter a valid token amount");
                                return;
                              }
                              removeTokens(doc._id, amount);
                              setRemovePopupDoctorId(null);
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="text-lg font-semibold text-gray-900 hover:text-gray-700"
                            onClick={() => setRemovePopupDoctorId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>

                <td className="border px-4 py-2">
                  {doc.isVerified ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 text-xs rounded-full">
                      Verified
                    </span>
                  ) : (
                    <button
                      className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                      onClick={() => verifyDoctor(doc._id)}
                    >
                      Verify
                    </button>
                  )}
                </td>
                <td className="border px-4 py-2">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      doc.isBlocked
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {doc.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
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
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => deleteDoctor(doc._id)}
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
        <AddDoctorModal
          onClose={() => setShow(false)}
          fetchDoctors={fetchDoctors}
        />
      )}
    </div>
  );
}
