import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  loginUser,
  fetchUserProfile,
} from "../../redux/slices/authSlice";
import config from "../../utils/config";
import user from "../../assets/user.png";
 
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
 
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
 
  const handleLoginClick = (doctor) => {
    setSelectedDoctor(doctor);
    setPassword("");
    setShowModal(true);
  };
 
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(
          `${config.API_URL}/api/auth/getAllDoctorsPublic`
        );
        setDoctors(res.data.doctors);
      } catch (err) {
        console.error("Doctor fetch error:", err);
        toast.error("Unable to load doctor list");
      }
    };
 
    fetchDoctors();
  }, []);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const email = selectedDoctor?.email?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!email || !emailRegex.test(email)) {
      toast.error("Invalid email format");
      return;
    }
  
    if (!password?.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
  
    const resultAction = await dispatch(loginUser({ email, password }));
  
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success("Login successful");
  
      // Rehydrate user data & tokens
      await dispatch(fetchUserProfile());
      await dispatch(fetchOwnDoctorTokens());
  
      navigate("/");
    } else {
      toast.error(resultAction.payload || "Login failed");
    }
  };
 
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex items-center justify-center px-4 py-8 bg-white sm:px-6 lg:px-12 sm:py-16 lg:py-20 min-h-screen">
        <div className="w-full h-full flex flex-col items-center mx-4 sm:mx-8 md:mx-20 lg:mx-24">
          <h2
            data-testid="login-heading"
            className="text-4xl mt-10 mb-10 font-bold leading-tight text-[#5c60c6] sm:text-5xl"
          >
            Use Your Account !
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                onClick={() => handleLoginClick(doctor)}
                className="cursor-pointer bg-white p-4 rounded-lg shadow hover:shadow-lg transition flex items-center space-x-4 hover:shadow-[#5c60c6]"
              >
                <img
                  src={user}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {doctor.name}
                  </h4>
                  <p className="text-sm text-gray-600">{doctor.email}</p>
                </div>
              </div>
            ))}
          </div>
 
          <p className="mt-8 text-lg text-gray-600 text-center">
            Can't see your account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="font-medium text-[#030811] transition-all duration-200 hover:text-[#5c60c6] focus:text-blue-700 hover:underline"
              tabIndex="0"
            >
              Add User
            </button>
          </p>
          <div className="mt-10 space-y-3"></div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg"
              aria-label="Close Modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
 
            <h3 className="text-lg font-semibold mb-4 mt-3 ml-1">
              Enter password for {selectedDoctor?.name}
            </h3>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 pr-10 border rounded"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={handleSubmit}
                className="bg-[#5c60c6] text-white px-4 py-2 rounded hover:opacity-90 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/forgot")}
                className="text-md text-[#5c60c6] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Login;
 