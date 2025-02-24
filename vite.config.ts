import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:8000'
  
  return {
    plugins: [react()],
    base: '/',
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'antd': ['antd'],
            'charts': ['@ant-design/charts', 'recharts']
          }
        }
      }
    },
    
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            'primary-color': '#1890ff'
          }
        }
      }
    },
    
    define: {
      __API_URL__: JSON.stringify(apiUrl)
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        '@ant-design/charts',
        'axios'
      ],
      exclude: ['@ant-design/plots']
    }
  }
})
