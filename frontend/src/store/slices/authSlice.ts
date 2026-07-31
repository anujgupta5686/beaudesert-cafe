import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import axios from "@/api/axios"
import type { Admin } from "@/types"

interface AuthState {
  admin: Admin | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  admin: localStorage.getItem("adminData")
    ? JSON.parse(localStorage.getItem("adminData")!)
    : null,
  token: localStorage.getItem("adminToken") || null,
  isAuthenticated: !!localStorage.getItem("adminToken"),
  isLoading: false,
  error: null,
}

export const loginAdmin = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post("/admin/login", credentials)
      return response.data.data
    } catch (error: any) {
      // ✅ IMPORTANT: Return error message properly
      return rejectWithValue(error.response?.data?.message || "Login failed")
    }
  }
)

export const logoutAdmin = createAsyncThunk("auth/logout", async () => {
  await axios.post("/admin/logout")
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminData")
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setAdmin: (state, action: PayloadAction<Admin>) => {
      state.admin = action.payload
      localStorage.setItem("adminData", JSON.stringify(action.payload))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.admin = action.payload.admin
        state.token = action.payload.token
        localStorage.setItem("adminToken", action.payload.token)
        localStorage.setItem("adminData", JSON.stringify(action.payload.admin))
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string // ✅ Error is set here
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError, setAdmin } = authSlice.actions
export default authSlice.reducer
