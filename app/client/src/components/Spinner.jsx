import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import loading from "../assets/animated.gif";

const Spinner = ({ path = "login" }) => {
  const [count, setCount] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevValue) => --prevValue);
    }, 1000);
    if (count === 0) {
      navigate(`/${path}`, {
        state: location.pathname,
      });
    }
    return () => clearInterval(interval);
  }, [count, navigate, location, path]);

  return (
    <div className="flex flex-col items-center justify-center h-screen dark:bg-[#030811] bg-[#5c60c6] text-white">
      {/* Centered and Enlarged GIF */}
      <div className="relative">
        <img className="w-32 h-24 animate-pulse" src={loading} alt="Loading" />
      </div>
    </div>
  );
};

export default Spinner;
