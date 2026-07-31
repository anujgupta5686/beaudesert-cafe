export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "anujgupta5686@gmail.com"

/** true when Vite is in development mode (`npm run dev`) */
export const IS_DEV = import.meta.env.DEV

/** true for production builds (Vercel / `npm run build`) */
export const IS_PROD = import.meta.env.PROD
