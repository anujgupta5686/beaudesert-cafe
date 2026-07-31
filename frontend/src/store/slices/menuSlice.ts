import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "@/api/axios"
import type { MenuItem } from "@/types"

interface MenuState {
  items: MenuItem[]
  loading: boolean
  error: string | null
}

const initialState: MenuState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchMenu = createAsyncThunk(
  "menu/fetch",
  async (
    options: { includeUnavailable?: boolean } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const params = options?.includeUnavailable
        ? { includeUnavailable: "true" }
        : undefined
      const response = await axios.get("/menu", { params })
      return response.data.data
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to fetch menu"
      return rejectWithValue(message)
    }
  }
)

export const createMenuItem = createAsyncThunk(
  "menu/create",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/menu", data)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create item"
      )
    }
  }
)

export const updateMenuItem = createAsyncThunk(
  "menu/update",
  async ({ id, data }: { id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/menu/${id}`, data)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update item"
      )
    }
  }
)

export const deleteMenuItem = createAsyncThunk(
  "menu/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/menu/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete item"
      )
    }
  }
)

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item._id === action.payload._id
        )
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload)
      })
  },
})

export default menuSlice.reducer
