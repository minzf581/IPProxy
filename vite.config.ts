import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',  // 为 React Router 使用绝对路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@frontend': path.resolve(__dirname, './frontend/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // 统一代理到后端
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy Error]', err);
          });
        }
      }
    },
    hmr: {
      overlay: false  // 禁用 HMR 错误覆盖
    }
  },
  envPrefix: 'VITE_',
  define: {
    'import.meta.env.VITE_DEBUG': JSON.stringify(true),
    'import.meta.env.VITE_API_MOCK': JSON.stringify(false),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8000')
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
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          'primary-color': '#1890ff',
        }
      }
    }
  }
})
