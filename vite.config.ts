import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Repo name on GitHub Pages. Served at https://<user>.github.io/MaintenanceTracker/
export default defineConfig({
  base: '/MaintenanceTracker/',
  plugins: [react(), tailwindcss()],
})
