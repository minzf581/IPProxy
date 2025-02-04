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
    port: 3000,
    proxy: {
      // IPIPV API 代理
      '^/api/open/app': {
        target: 'https://sandbox.ipipv.com',
        changeOrigin: true,
        secure: false,  // 忽略证书错误
        ws: false,
        configure: (proxy, options) => {
          // 解析请求体
          proxy.on('proxyReq', (proxyReq, req: any, res) => {
            // 移除重复的 /api 前缀
            const originalPath = proxyReq.path;
            const normalizedPath = originalPath.replace(/^\/api\/api\//, '/api/');
            proxyReq.path = normalizedPath;

            // 修改请求头
            proxyReq.setHeader('Host', 'sandbox.ipipv.com');
            proxyReq.setHeader('Origin', 'https://sandbox.ipipv.com');
            proxyReq.setHeader('Referer', 'https://sandbox.ipipv.com');

            // 打印请求信息
            console.log('[Proxy Debug]', {
              method: proxyReq.method,
              originalPath,
              normalizedPath,
              headers: proxyReq.getHeaders(),
              rawBody: req.rawBody
            });

            // 如果是 POST 请求，确保请求体被正确发送
            if (req.method === 'POST' && req.rawBody) {
              const bodyData = req.rawBody.toString('utf8');
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
              proxyReq.write(bodyData);
            }
          });

          proxy.on('proxyRes', (proxyRes, req: any, res) => {
            // 处理 CORS
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type,X-Requested-With';
            proxyRes.headers['access-control-allow-credentials'] = 'true';

            // 打印响应信息
            console.log('[Proxy Response]', {
              status: proxyRes.statusCode,
              headers: proxyRes.headers,
              path: req.url,
              method: req.method
            });

            // 如果是 404，打印更多信息以便调试
            if (proxyRes.statusCode === 404) {
              console.error('[Proxy 404]', {
                url: req.url,
                method: req.method,
                headers: req.headers
              });
            }
          });

          proxy.on('error', (err, req: any, res) => {
            console.error('[Proxy Error]', {
              error: err.message,
              url: req.url,
              method: req.method,
              headers: req.headers
            });
          });
        }
      },
      // 本地后端 API 代理
      '^/api/(?!open/app)': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req: any, res) => {
            // 移除重复的 /api 前缀
            const originalPath = proxyReq.path;
            const normalizedPath = originalPath.replace(/^\/api\/api\//, '/api/');
            proxyReq.path = normalizedPath;

            // 打印请求信息
            console.log('[Local Proxy Debug]', {
              method: proxyReq.method,
              originalPath,
              normalizedPath
            });
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
