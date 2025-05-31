// src/routes/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { fetchUserProfile } from "../redux/slices/authSlice";

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [rehydrated, setRehydrated] = useState(false);

  useEffect(() => {
    // Dispatch fetchUserProfile and wait at least 500ms
    const rehydrate = async () => {
      await dispatch(fetchUserProfile());
      setTimeout(() => {
        setRehydrated(true);
      }, 100);
    };
    rehydrate();
  }, [dispatch]);

  if (loading || !rehydrated) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default PrivateRoute;
