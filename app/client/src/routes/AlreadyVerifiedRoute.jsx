// routes/AlreadyVerifiedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import config from "../utils/config";
import { toast } from "react-toastify";

const AlreadyVerifiedRoute = () => {
  const [isVerified, setIsVerified] = useState(null); // Track verification status

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const res = await axios.get(`${config.API_URL}/api/auth/get/verificationStatus`, {
          withCredentials: true,
        });

        setIsVerified(res.data.isVerified);
      } catch (error) {
        console.error("Error checking verification status:", error);
        setIsVerified(false);
      }
    };

    checkVerificationStatus();
  }, []);

  if (isVerified === null) {
    return <p>Loading...</p>; // Prevents flicker while checking
  }

  // Redirect to dashboard if already verified
  return isVerified ? <Navigate to="/dashboard" /> : <Outlet />;
};

export default AlreadyVerifiedRoute;
