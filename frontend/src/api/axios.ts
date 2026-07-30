import axios from "axios"
import { API_URL } from "@/utils/constants"

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
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
