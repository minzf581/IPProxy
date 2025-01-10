import axios from 'axios';

const request = axios.create({
  baseURL: 'http://localhost:3001',  // Point directly to proxy server
  timeout: 30000,  // 增加超时时间到 30 秒
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response;
    if (data.code === 200) {  // API v2 使用 200 作为成功状态码
      return data;
    }
    throw new Error(data.msg || 'Error');
  },
  error => {
    if (error.response) {
      console.error('Response error:', error.response.data);
      throw new Error(error.response.data.msg || 'API request failed');
    } else if (error.request) {
      console.error('Request error:', error.message);
      throw new Error('Network error');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
);

export default request;