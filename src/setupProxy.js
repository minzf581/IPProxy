const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理到后端Flask服务
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'  // 保持/api前缀
      },
      onProxyReq: function(proxyReq, req, res) {
        // 打印请求信息
        console.log('Proxying to backend:', req.method, req.url);
        
        // 如果是 POST 请求，打印请求体
        if (req.method === 'POST' && req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      onProxyRes: function(proxyRes, req, res) {
        // 打印响应状态
        console.log('Backend response status:', proxyRes.statusCode);
      },
      onError: function(err, req, res) {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          code: 500,
          msg: 'Proxy error',
          error: err.message 
        }));
      }
    })
  );
};
