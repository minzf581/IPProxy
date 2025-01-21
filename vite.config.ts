import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',  // Changed to absolute path for React Router
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/dynamic-orders': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/static-orders': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/dynamic-ips': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/static-ips': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    hmr: {
      // Log HMR events
      log: 'debug',
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_API_MOCK': JSON.stringify(true),
    // Add more debug flags
    'process.env.VITE_DEBUG': JSON.stringify(true),
    'process.env.VITE_DEBUG_PROXY': JSON.stringify(true)
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd': ['antd']
        }
      }
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    }
  }
})
