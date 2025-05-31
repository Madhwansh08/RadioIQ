import Header from "../../components/Header";
import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import config from "../../utils/config";
import tnc from "../../assets/Radioiq-TnC.pdf";
import pp from "../../assets/Radioiq-PP.pdf";
import regimage from "../../assets/RV-signup.gif";
import { MdContentCopy, MdClose } from "react-icons/md";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
  });

  const [showResetCodeModal, setShowResetCodeModal] = useState(false);
  const [generatedResetCode, setGeneratedResetCode] = useState("");

  // const [otpSent, setOtpSent] = useState(false);
  // const [otpToken, setOtpToken] = useState(null);
  // const [otp, setOtp] = useState(new Array(6).fill(""));
  // const inputRefs = useRef([]);

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
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must contain at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }
    if (!/\d/.test(formData.password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (!/[!@#$%^&*]/.test(formData.password)) {
      toast.error(
        "Password must contain at least one special character (!@#$%^&*)"
      );
      return;
    }
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error("Phone number must be 10 digits");
      return;
    }
    if (!document.getElementById("terms").checked) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_URL}/api/auth/register`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        toast.success("Registration Successfull!");
        setGeneratedResetCode(response.data.resetCode);
        setShowResetCodeModal(true);
      } else {
        toast.error(`Registration failed: ${response.statusText}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(
          `Error: ${error.response.data.message || "Server error occurred"}`
        );
      } else if (error.request) {
        toast.error("No response from server. Please try again later.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  // const handleOtpChange = (value, index) => {
  //   if (/^\d$/.test(value) || value === "") {
  //     const updatedOtp = [...otp];
  //     updatedOtp[index] = value;
  //     setOtp(updatedOtp);
  //     if (value && index < inputRefs.current.length - 1) {
  //       inputRefs.current[index + 1].focus();
  //     }
  //   }
  // };

  // const handleVerifyOtp = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const otpValue = otp.join("");
  //     const response = await axios.post(
  //       `${config.API_URL}/api/auth/verifyRegistrationOTP`,
  //       { email: formData.email, enteredOTP: otpValue, otpToken }
  //     );
  //     toast.success("Verification successful");
  //     navigate("/login");
  //   } catch (error) {
  //     toast.error("Invalid OTP, please try again");
  //   }
  // };

  const handleSkip = () => {
    navigate("/login");
  };

  return (
    <div className="h-screen flex-flex-col">
      <Header />
      <section className="bg-[#030811] flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          <div className="relative flex items-end px-4 pb-10 pt-60 sm:pb-16 md:justify-center lg:pb-24 bg-gray-50 sm:px-6 lg:px-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                className="object-contain max-w-full max-h-full"
                src={regimage}
                alt=""
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#030811] to-transparent" />
            <div className="relative">
              <div className="w-full max-w-xl xl:w-full xl:mx-auto xl:pr-24 xl:max-w-xl">
                <h3 className="text-3xl font-bold text-white">
                  Get Started with{" "}
                  <span className="text-[#5c60c6]">RadioIQ</span>
                  <br className="hidden xl:block" />
                </h3>
                {/* <ul className="grid grid-cols-1 mt-10 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <li className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 bg-[#5c60c6] rounded-full">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-medium text-white">
                      {" "}
                      Workflow
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 bg-[#5c60c6] rounded-full">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-medium text-white">
                      {" "}
                      LoremIpsum{" "}
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 bg-[#5c60c6] rounded-full">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-medium text-white">
                      {" "}
                      120+ Dataset{" "}
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 bg-[#5c60c6] rounded-full">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-medium text-white">
                      {" "}
                      LoremIpsum{" "}
                    </span>
                  </li>
                </ul> */}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center px-4 py-10 bg-white sm:px-6 lg:px-8 sm:py-16 lg:py-24">
            <div className="w-full mx-24 sm:mx-20 pt-12">
              <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl">
                Sign up to RadioIQ
              </h2>
              <form onSubmit={handleSubmit} className="mt-8">
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor
                      className="text-base font-medium text-gray-900"
                    >
                      {" "}
                      Name{" "}
                    </label>
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor
                      className="text-base font-medium text-gray-900"
                    >
                      {" "}
                      Phone Number{" "}
                    </label>
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter your Phone Number"
                        className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor
                      className="text-base font-medium text-gray-900"
                    >
                      {" "}
                      Email address{" "}
                    </label>
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
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email to get started"
                        className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor
                      className="text-base font-medium text-gray-900"
                    >
                      {" "}
                      Password{" "}
                    </label>
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
                        id
                        placeholder="Enter your password"
                        className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white caret-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center"></div>
                    <input
                      type="checkbox"
                      name="terms"
                      id="terms"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="ml-2 text-sm text-gray-600"
                    >
                      I agree to the{" "}
                      <a
                        href={tnc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        terms and conditions{" "}
                      </a>
                      &{" "}
                      <a
                        href={pp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        privacy policy
                      </a>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="inline-flex items-center justify-center w-full px-4 py-4 text-base font-semibold text-white transition-all duration-200 border border-transparent rounded-md bg-gradient-to-r from-[#030811] to-[#5c60c6] focus:outline-none hover:opacity-80 focus:opacity-80"
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              </form>
              <p className="mt-8 text-lg text-gray-600 text-center">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  title="Login"
                  className="font-medium text-[#030811] transition-all duration-200 hover:text-blue-700 focus:text-blue-700 hover:underline"
                  tabIndex="0"
                >
                  Login
                </button>
              </p>
              <div className="mt-3 space-y-3">
                {/* <button type="button"   className="relative inline-flex items-center justify-center w-full px-4 py-4 text-base font-semibold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-200 rounded-md hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black focus:outline-none">
              <div className="absolute inset-y-0 left-0 p-4">
                <svg className="w-6 h-6 text-rose-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
                </svg>
              </div>
              Sign up with Google
            </button>
           */}
              </div>
              {/* <p className="mt-5 text-sm text-gray-600">
            This site is protected by reCAPTCHA and the Google <a href="#" title className="text-blue-600 transition-all duration-200 hover:underline hover:text-blue-700">Privacy Policy</a> &amp;
            <a href="#" title className="text-blue-600 transition-all duration-200 hover:underline hover:text-blue-700">Terms of Service</a>
          </p> */}
            </div>
            {/* ) : (
              <div className="xl:w-full space-y-10 mt-5 pb-20 xl:max-w-sm 2xl:max-w-md xl:mx-auto">
                <h2
                  data-testid="otp-heading"
                  className="text-4xl mt-10 text-center justify-center mr-10 font-bold leading-tight mb-5 text-black sm:text-5xl"
                >
                  Verify OTP
                </h2>
                <form onSubmit={handleVerifyOtp} className="w-full">
                  <div className="flex justify-center gap-2 mb-10">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        value={digit}
                        maxLength={1}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        ref={(el) => (inputRefs.current[index] = el)}
                        className="w-12 h-12 text-center text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-4 p-2 bg-[#030811] text-white rounded"
                  >
                    Verify OTP
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full mt-4 p-2 bg-[#030811] text-white rounded"
                  >
                    Skip
                  </button>
                </form>
                <div className="mt-3 space-y-3"></div>
              </div> */}
          </div>
        </div>
      </section>
      {showResetCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-lg relative">
            {/* Close Icon */}
            <button
               onClick={() => {
                setShowResetCodeModal(false);
                navigate("/login");
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              title="Close"
            >
              <MdClose size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Important!
            </h2>
            <p className="mb-4 text-gray-700">
              Your unique <strong>Reset Code</strong> is:
            </p>
            <div className="relative inline-block bg-gray-100 rounded px-3 py-2 text-2xl font-mono font-bold text-blue-600 mb-6">
              {generatedResetCode}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedResetCode);
                  toast.success("Code copied to clipboard!");
                }}
                className="absolute top-3 -right-7 text-gray-500 hover:text-gray-800"
                title="Copy to clipboard"
              >
                <MdContentCopy size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Please save this code safely. You will need it to reset your
              password in the future. Take a screenshot, copy it, or download
              it.
            </p>

            <button
              onClick={() => {
                const blob = new Blob([generatedResetCode], {
                  type: "text/plain",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${formData.email}_reset.key`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                navigate("/login");
              }}
              className="w-full group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[#5c60c6] px-6 font-medium text-white transition hover:shadow-[0_4px_15px_#5c60c6]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-[1.5s] group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20"></div>
              </div>
              <span className="mr-4 text-xl">Download Code</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
