import express from 'express';
import cors from 'cors';
import axios from 'axios';
import https from 'https';

const app = express();
const PORT = 3001;
const PROXY_BASE_URL = 'https://sandbox.ipipv.com';

// 启用 CORS
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 日志工具函数
function logObject(name, obj) {
  console.log(`\n=== ${name} ===`);
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      console.log(`${key}:`, value);
    } else if (typeof value === 'object') {
      console.log(`${key}:`, JSON.stringify(value, null, 2));
    } else {
      console.log(`${key}:`, value);
    }
  }
  console.log('=== End ===\n');
}

// 清理请求体
function cleanRequestBody(body) {
  try {
    // 1. 创建新对象
    const cleaned = {};
    
    // 2. 提取有效字段
    const validFields = ['version', 'encrypt', 'appKey', 'reqId', 'params'];
    for (const field of validFields) {
      if (field in body) {
        cleaned[field] = body[field];
      }
    }
    
    // 3. 特殊处理 params 字段
    if ('params' in cleaned) {
      // 移除所有空格和引号
      const paramsStr = cleaned.params.toString()
        .replace(/[\s"']+/g, '')
        .replace(/params"?:/, '')
        .replace(/\{|\}/g, '');
      
      // 提取有效的 Base64 字符串
      const base64Pattern = /[A-Za-z0-9+/=]+/;
      const match = paramsStr.match(base64Pattern);
      
      if (match) {
        cleaned.params = match[0];
        // 验证 Base64 长度（应该是 4 的倍数）
        if (cleaned.params.length % 4 !== 0) {
          throw new Error('Invalid Base64 length');
        }
      } else {
        throw new Error('No valid Base64 string found in params');
      }
    }
    
    // 4. 清理其他字符串值
    for (const [key, value] of Object.entries(cleaned)) {
      if (key !== 'params' && typeof value === 'string') {
        cleaned[key] = value.trim();
      }
    }
    
    // 5. 验证清理后的数据
    console.log('\n=== Validation Details ===');
    console.log('Original params:', body.params);
    console.log('Cleaned params:', {
      value: cleaned.params,
      length: cleaned.params?.length,
      isBase64: /^[A-Za-z0-9+/=]+$/.test(cleaned.params || ''),
      validLength: (cleaned.params?.length % 4) === 0
    });
    console.log('=== End Validation ===\n');
    
    return cleaned;
  } catch (error) {
    console.error('\n=== Cleaning Error Details ===');
    console.error('Error:', error.message);
    console.error('Original params:', body.params);
    console.error('=== End Error Details ===\n');
    throw new Error('Failed to clean request body: ' + error.message);
  }
}

// API 请求处理函数
const handleAPIRequest = async (req, res) => {
  try {
    // 1. 记录原始请求
    console.log('\n=== Original Request Details ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Original Body:', JSON.stringify(req.body, null, 2));
    console.log('=== End Original Request Details ===\n');

    // 验证 appKey
    if (req.body.appKey !== 'AK20241120145620') {
      return res.status(400).json({ error: 'Invalid appKey' });
    }

    // 2. 清理请求体
    const cleanedBody = cleanRequestBody(req.body);
    console.log('\n=== Cleaned Request Body ===');
    console.log(JSON.stringify(cleanedBody, null, 2));
    console.log('=== End Cleaned Request Body ===\n');

    // 3. 验证必要字段
    const requiredFields = ['version', 'encrypt', 'appKey', 'params'];
    const missingFields = requiredFields.filter(field => !cleanedBody[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // 4. 构建目标 URL
    const targetUrl = `${PROXY_BASE_URL}${req.url}`;
    console.log('\n[Proxy] Forwarding to:', targetUrl);

    // 5. 添加用户名信息
    const requestBody = {
      ...cleanedBody,
      appUsername: 'admin'  // 添加默认的应用用户名
    };

    // 6. 发送请求
    console.log('\n=== Sending Request to API ===');
    console.log('Target URL:', targetUrl);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      targetUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'IPProxyWeb/1.0'
        },
        timeout: 30000,
        validateStatus: null,
        httpsAgent: new https.Agent({ 
          rejectUnauthorized: false
        })
      }
    );

    // 7. 记录响应
    console.log('\n=== API Response Details ===');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('=== End Response Details ===\n');

    // 8. 发送响应
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('\n=== API Error Details ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('=== End Error Details ===\n');

    res.status(500).json({
      code: 500,
      msg: error.message,
      data: null
    });
  }
};

// 注册具体的 API 路由
app.post('/api/open/app/info/v2', handleAPIRequest);
app.post('/api/open/app/product/query/v2', handleAPIRequest);
app.post('/api/open/app/proxy/info/v2', handleAPIRequest);
app.post('/api/open/app/user/create/v2', handleAPIRequest);
app.post('/api/open/app/proxy/balance/v2', handleAPIRequest);
app.post('/api/open/app/user/v2', handleAPIRequest);  // 新增创建主账号的路由
app.post('/api/open/app/order/v2', handleAPIRequest);
app.post('/api/open/app/flow/usage/v2', handleAPIRequest);

// 获取实例信息
app.post('/api/open/app/instance/v2', async (req, res) => {
  try {
    const { instances } = req.body;
    
    // 验证参数
    if (!Array.isArray(instances) || instances.length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '实例列表不能为空',
        data: null
      });
    }

    // 模拟数据
    const mockData = instances.map(instanceNo => ({
      instanceNo,
      proxyType: Math.random() > 0.5 ? 102 : 103, // 随机分配代理类型
      status: Math.floor(Math.random() * 4) + 1, // 随机状态 1-4
      openAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 随机开通时间
      userExpired: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // 随机到期时间
      flowTotal: Math.floor(Math.random() * 1000000000), // 随机总流量
      flowBalance: Math.floor(Math.random() * 500000000) // 随机剩余流量
    }));

    res.json({
      code: 200,
      msg: 'success',
      data: mockData
    });
  } catch (error) {
    console.error('Error in /api/open/app/instance/v2:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 获取订单信息
app.post('/api/open/app/order/v2', async (req, res) => {
  try {
    const { orderNo, page = 1, pageSize = 10 } = req.body;

    // 生成模拟订单数据
    const mockOrders = Array.from({ length: pageSize }, (_, index) => ({
      orderNo: orderNo || `ORDER${Date.now()}${index}`,
      type: Math.floor(Math.random() * 3) + 1, // 1-3
      status: Math.floor(Math.random() * 5) + 1, // 1-5
      count: Math.floor(Math.random() * 10) + 1,
      amount: Math.floor(Math.random() * 10000),
      instances: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
        instanceNo: `INST${Date.now()}${Math.floor(Math.random() * 1000)}`,
        proxyType: Math.random() > 0.5 ? 102 : 103,
        status: Math.floor(Math.random() * 4) + 1,
        openAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        userExpired: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        totalFlow: Math.floor(Math.random() * 1000000000)
      }))
    }));

    res.json({
      code: 200,
      msg: 'success',
      data: {
        list: mockOrders,
        total: 100,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error in /api/open/app/order/v2:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    msg: 'Internal Server Error',
    data: null
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
  console.log(`Proxying requests to: ${PROXY_BASE_URL}`);
});
