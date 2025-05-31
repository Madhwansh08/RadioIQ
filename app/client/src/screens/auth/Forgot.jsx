import React, { useState } from "react";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import config from "../../utils/config";
import forgotimg from "../../assets/RV_forgotpassword.gif";

const Forgot = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCode, setResetCode] = useState("");

  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${config.API_URL}/api/auth/reset-password`,
        { email, resetCode, newPassword: newPassword }
      );
      toast.success(response.data.message);
      setEmail("");
      setResetCode("");
      setNewPassword("");
      navigate("/login");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeadingAndText = () => {
    return (
      <>
        <h1 className="text-6xl font-bold text-[#fdfdfd] dark:text-[#030811] mb-8">
          Forgot Password
        </h1>
        <p className="text-[#fdfdfd] dark:text-[#030811] text-2xl mb-16">
          Enter your email and reset Code to change Password
        </p>
      </>
    );
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>

          <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
            <div className="absolute inset-y-0 left-0   flex items-center pl-3 pointer-events-none">
              <svg
                className="h-6 w-6 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.75 5.25L3 6V18L3.75 18.75H20.25L21 18V6L20.25 5.25H3.75ZM4.5 7.6955V17.25H19.5V7.69525L11.9999 14.5136L4.5 7.6955ZM18.3099 6.75H5.68986L11.9999 12.4864L18.3099 6.75Z"
                    fill="#9ca3af"
                  ></path>{" "}
                </g>
              </svg>
            </div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id
              placeholder="Enter email"
              className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-400 rounded-md bg-gray-50 focus:outline-none"
            />
          </div>
        </div>
        <label htmlFor="resetCode" className="sr-only">
          Reset Code
        </label>
        <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
          <div className="absolute inset-y-0 left-0   flex items-center pl-3 pointer-events-none">
            <svg
              className="h-6 w-6 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.75 5.25L3 6V18L3.75 18.75H20.25L21 18V6L20.25 5.25H3.75ZM4.5 7.6955V17.25H19.5V7.69525L11.9999 14.5136L4.5 7.6955ZM18.3099 6.75H5.68986L11.9999 12.4864L18.3099 6.75Z"
                  fill="#9ca3af"
                ></path>{" "}
              </g>
            </svg>
          </div>
          <input
            type="text"
            name="resetCode"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            id
            placeholder="Enter reset code"
            className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-400 rounded-md bg-gray-50 focus:outline-none"
          />
        </div>
        <label htmlFor="newPassword" className="sr-only">
          New Password
        </label>
        <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
          <div className="absolute inset-y-0 left-0   flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.5 9C12.9853 9 15 6.98528 15 4.5C15 2.01472 12.9853 0 10.5 0C8.01475 0 6.00003 2.01472 6.00003 4.5C6.00003 5.38054 6.25294 6.20201 6.69008 6.89574L0.585815 13L3.58292 15.9971L4.99714 14.5829L3.41424 13L5.00003 11.4142L6.58292 12.9971L7.99714 11.5829L6.41424 10L8.10429 8.30995C8.79801 8.74709 9.61949 9 10.5 9ZM10.5 7C11.8807 7 13 5.88071 13 4.5C13 3.11929 11.8807 2 10.5 2C9.11932 2 8.00003 3.11929 8.00003 4.5C8.00003 5.88071 9.11932 7 10.5 7Z"
                  fill="#9ca3af"
                ></path>{" "}
              </g>
            </svg>
          </div>
          <input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            id
            placeholder="Enter new Password"
            className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-400 rounded-md bg-gray-50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
        >
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20"></div>
          </div>
          <span className="mr-4 text-xl">{!isLoading ? "Reset Password" : "Resetting..."}</span>
        </button>
      </form>
    );
  };

  return (
    <div>
      <Header />
      <section className="flex justify-center min-h-screen bg-[#030811] dark:bg-[#fdfdfd] relative overflow-x-hidden overflow-y-hidden">
        {/* Content section */}
        <div className="w-1/2 flex flex-col gap-y-8 items-center justify-center">
          <div className="w-4/5 py-8 px-16 relative">
            {/* Render Heading and Text */}
            <div className="relative z-10 bg-opacity-0 text-center">
              {renderHeadingAndText()}
            </div>
            {/* Render Form */}
            <div className="relative z-10 bg-opacity-0">{renderForm()}</div>
          </div>
        </div>

        {/* Background Image section */}
        <div className="w-1/2">
          <img
            src={forgotimg}
            alt="BackgroundImage"
            className="w-[100%] h-full pt-10 pl-10 object-cover"
          />
        </div>
      </section>
    </div>
  );
};

export default Forgot;
