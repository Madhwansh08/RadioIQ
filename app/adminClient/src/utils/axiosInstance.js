// utils/axiosInstance.js
import axios from "axios";
import config from "./config";

const axiosInstance = axios.create({
  baseURL: config.API_URL,
  withCredentials: true,
});

// Request interceptor to attach token
axiosInstance.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    console.log("✅ Authorization header set to:", req.headers.Authorization);
  }
  return req;
});

// Response interceptor to handle token issues
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      console.warn("⚠️ Unauthorized - clearing token");
      localStorage.removeItem("adminToken");

      // Optionally redirect (if you still want this for 401)
      // window.location.href = "/admin-login";
    }

    // Do NOT clear token or redirect on 403
    if (status === 403) {
      console.warn("🚫 Forbidden - user lacks permission");
      // You might choose to show a toast in your component
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
