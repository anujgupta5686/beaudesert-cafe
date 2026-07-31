import axios from "axios"
import { API_URL } from "@/utils/constants"

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    // Let the browser set multipart boundary for FormData
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"]
        delete config.headers["content-type"]
      }
    } else if (config.headers && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json"
    }

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
    // Only force-logout on real auth failures — never on network / timeout
    const status = error.response?.status
    const isNetwork =
      !error.response &&
      (error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED" ||
        error.message === "Network Error")

    if (status === 401 && !isNetwork) {
      const currentPath = window.location.pathname
      if (
        !currentPath.includes("/admin/login") &&
        !currentPath.includes("/admin/forgot") &&
        !currentPath.includes("/admin/verify") &&
        !currentPath.includes("/admin/reset")
      ) {
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminData")
        window.location.href = "/admin/login"
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
