import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disable StrictMode to prevent double rendering in development
      strictMode: false,
      // Add more React plugin options for debugging
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          // Add console.log to track component rendering
          ['@babel/plugin-transform-react-jsx', {
            pragma: 'console.log("Rendering JSX"); React.createElement',
          }]
        ]
      }
    })
  ],
  base: '/',  // Changed to absolute path for React Router
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          // Log all proxy events
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy Error]', {
              error: err.message,
              url: req.url,
              method: req.method,
              headers: req.headers
            });
          });

          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Proxy Request]', {
              url: req.url,
              method: req.method,
              headers: req.headers,
              body: req.body
            });
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Proxy Response]', {
              url: req.url,
              method: req.method,
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers
            });

            // Log response body for debugging
            let body = '';
            proxyRes.on('data', chunk => {
              body += chunk;
            });
            proxyRes.on('end', () => {
              try {
                const parsedBody = JSON.parse(body);
                console.log('[Proxy Response Body]', parsedBody);
              } catch (e) {
                console.log('[Proxy Response Body]', body);
              }
            });
          });
        }
      }
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
