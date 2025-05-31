import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import config from "../utils/config";

export default function VerifiedRoute() {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!auth?.user) {
        setLoading(false);
        return;
      }

      try {
        // ✅ Check if the user is verified
        const res = await axios.get(`${config.API_URL}/api/auth/get/verificationStatus`, {
          withCredentials: true,
        });

        if (res.data.isVerified) {
          setIsVerified(true);
     
        } else {
          navigate("/verify"); // Redirect to verify page
        }
      } catch (error) {
        console.error("Error while checking verification status:", error);
        toast.error(error?.response?.data?.message || "An error occurred. Please try again.");
        navigate("/verify"); // Redirect in case of error
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [auth?.user, navigate]);

  if (loading) return <Spinner />;
  
  return isVerified ? <Outlet /> : null;
}
