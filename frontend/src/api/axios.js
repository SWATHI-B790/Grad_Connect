import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Request interceptor to attach token from localStorage if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for 403 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only dispatch toast for transient action restrictions (NOT for page-level menu access which renders in-page)
    if (error.response && error.response.status === 403) {
      const data = error.response.data || {};
      const method = (error.config?.method || "").toUpperCase();

      // For non-GET mutations with usage limit restriction, show transient toast
      if (data.restricted === true && method !== "GET") {
        const message = data.msg || data.message || "Your access is restricted. It will be renewed tomorrow.";
        window.dispatchEvent(
          new CustomEvent("show-toast", { detail: { message, type: "warning" } })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default API;
