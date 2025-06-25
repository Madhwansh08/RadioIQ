// utils/axiosInstance.js
import axios from "axios";
import config from "./config";

const axiosInstance = axios.create({
  baseURL: config.API_URL,
});

// 🧠 Most Reliable: Use request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  console.log("🔑 Using token:", token);

  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization; // don't send null/undefined
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
