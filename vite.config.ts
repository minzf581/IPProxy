import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Changed to relative path for better compatibility
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,  // Update to match the actual port
    strictPort: true  // This will make Vite fail if the port is not available instead of trying another one
  }
})
