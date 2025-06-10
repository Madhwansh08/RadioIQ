import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/admin/doctors");
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const verifyDoctor = async (doctorId) => {
    try {
      await axios.patch(`/admin/doctors/${doctorId}/verify`);
      fetchDoctors();
    } catch (error) {
      console.error("Error verifying doctor:", error);
    }
  };

  const blockDoctor = async (doctorId) => {
    try {
      await axios.patch(`/admin/doctors/${doctorId}/block`);
      fetchDoctors();
    } catch (error) {
      console.error("Error blocking doctor:", error);
    }
  };

  const deleteDoctor = async (doctorId) => {
    try {
      await axios.delete(`/admin/doctors/${doctorId}`);
      fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Doctors List</h1>
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
            {doctors.map((doctor) => (
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
    </div>
  );
}
