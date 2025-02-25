import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 获取 API URL，优先使用环境变量
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:8000'
  console.log('API URL:', apiUrl)
  console.log('Mode:', mode)
  console.log('Command:', command)
  
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
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined,
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
      __API_URL__: JSON.stringify(apiUrl),
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env.NODE_ENV': JSON.stringify(mode)
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
    },

    // 添加环境变量处理
    envPrefix: 'VITE_',
    clearScreen: false,
    logLevel: 'info'
  }
})
