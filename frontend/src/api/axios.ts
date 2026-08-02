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
    const code = error.response?.data?.code
    const isNetwork =
      !error.response &&
      (error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED" ||
        error.message === "Network Error")

    if ((status === 401 || status === 403) && !isNetwork) {
      const currentPath = window.location.pathname
      const isAuthPage =
        currentPath.includes("/admin/login") ||
        currentPath.includes("/admin/forgot") ||
        currentPath.includes("/admin/verify") ||
        currentPath.includes("/admin/reset")

      if (!isAuthPage) {
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminData")
        const reason =
          code === "SESSION_REPLACED"
            ? "session_replaced"
            : status === 401
              ? "auth"
              : "forbidden"
        window.location.href = `/admin/login?reason=${reason}`
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
