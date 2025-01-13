import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 在这里添加请求头等配置
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 处理响应数据
    return response;
  },
  (error) => {
    // 处理错误响应
    console.error('[API Error]:', error);
    return Promise.reject(error);
  }
);

export default api;
