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
  build: {
    cssMinify: false,
    chunkSizeWarningLimit: 1000,
  },
  css: {
    postcss: "./postcss.config.js",
  },
})
