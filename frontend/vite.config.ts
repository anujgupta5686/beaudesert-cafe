import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://beaudesert-cafe-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  // ✅ ADD THIS - Disable CSS minification for Tailwind v4
  build: {
    cssMinify: false,
  },
})
