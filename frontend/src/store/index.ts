import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import cartReducer from "./slices/cartSlice"
import menuReducer from "./slices/menuSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    menu: menuReducer,
  },
  devTools: import.meta.env.NODE_ENV !== "production",
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
