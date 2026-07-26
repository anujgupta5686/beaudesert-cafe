import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

// Request interceptor - add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ IMPORTANT: Only redirect if NOT on login page
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (!currentPath.includes("/admin/login")) {
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminData")
        window.location.href = "/admin/login"
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
