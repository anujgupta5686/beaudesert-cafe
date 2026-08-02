/**
 * API base URL — always points at the backend for the current environment.
 * Local:  `.env.development` → http://localhost:5000/api
 * Production (EC2 + Nginx): prefer relative `/api` so www/non-www + mobile
 * always hit the same host (avoids CORS / mixed-content flakes).
 */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api")

export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "beaudesertcafe@gmail.com"

/** true when Vite is in development mode (`npm run dev`) */
export const IS_DEV = import.meta.env.DEV

/** true for production builds (Vercel / `npm run build`) */
export const IS_PROD = import.meta.env.PROD
