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
    },
  },
  server: {
    port: 3000,  // 使用默认的 3000 端口
    host: true,  // 允许外部访问
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path  // 不重写路径，保持/api前缀
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
