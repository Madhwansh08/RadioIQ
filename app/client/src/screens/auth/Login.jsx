import { useState } from "react";
import Header from "../../components/Header";
// import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {
  loginUser,
  fetchProfilePicture,
  fetchUserProfile,
} from "../../redux/slices/authSlice";
import config from "../../utils/config";
import login from "../../assets/RV_login.gif";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return;
    }
    if (!formData.password) {
      toast.error("Password cannot be empty");
      return;
    }
    const resultAction = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success("Login successful");
      // Rehydrate user data
      dispatch(fetchUserProfile());
      navigate("/");
    } else {
      toast.error(resultAction.payload || "Login failed");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <section className="bg-white flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        <div className="relative flex items-end px-4 pb-6 pt-40 sm:pb-10 md:justify-center lg:pb-24 bg-gray-50 sm:px-6 lg:px-8 sm:pt-60">
            <div className="absolute inset-0">
              <img
                className="object-cover object-top w-full h-full"
                src={login}
                  alt="Medical illustration"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t mt-5  from-[#030811] to-transparent" />
            <div className="relative">
              <div className="w-full max-w-xl xl:w-full xl:mx-auto xl:pr-24 xl:max-w-xl">
                <h3 className="text-4xl font-bold text-white">
                  Welcome to<span className="text-[#5c60c6]"> RadioIQ</span>
                  <br className="hidden xl:block" />
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center px-4 py-8 bg-white sm:px-6 lg:px-12 sm:py-16 lg:py-20">
          <div className="w-full mx-4 sm:mx-8 md:mx-20 lg:mx-24">
              <h2
                data-testid="login-heading"
                className="text-4xl mt-10 font-bold leading-tight text-black sm:text-5xl"
              >
                Sign in to RadioIQ
              </h2>
              <form onSubmit={handleSubmit} className="mt-8 sm:mt-10">
              <div className="space-y-5 sm:space-y-7">
                  <div>
                  <label htmlFor="email" className="text-sm sm:text-base font-medium text-gray-900">
                      {" "}
                      Email address{" "}
                    </label>
                    <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
                      <div className="absolute inset-y-0 left-0   flex items-center pl-3 pointer-events-none">
                        <svg
                          className="w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        id="email"
                        placeholder="Enter email to get started"
                        className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-base font-medium text-gray-900"
                      >
                        {" "}
                        Password{" "}
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot")}
                        className="text-sm font-medium text-blue-600 transition-all duration-200 hover:text-[#030811] focus:text-blue-700 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                          className="w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                          />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        id="password"
                        placeholder="Enter your password"
                        className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      data-testid="submit"
                      className="inline-flex items-center justify-center w-full px-4 py-4 mt-4 pt-4 text-base font-semibold text-white transition-all duration-200 border border-transparent rounded-md bg-gradient-to-r from-[#030811] to-[#5c60c6] focus:outline-none hover:opacity-80 focus:opacity-80"
                    >
                      Log in
                    </button>
                  </div>
                </div>
              </form>
              <p className="mt-8 text-lg text-gray-600 text-center">
                Don’t have an account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="font-medium text-[#030811] transition-all duration-200 hover:text-blue-700 focus:text-blue-700 hover:underline"
                  tabIndex="0"
                >
                  Create a free account
                </button>
              </p>
              <div className="mt-10 space-y-3">
                {/* <button type="button"  className="relative inline-flex items-center justify-center w-full px-4 py-4 text-base font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-200 rounded-md hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black focus:outline-none">
            <div className="absolute inset-y-0 left-0 p-4">
              <svg className="w-6 h-6 text-rose-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
              </svg>
            </div>
            Sign in with Google
          </button> */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
