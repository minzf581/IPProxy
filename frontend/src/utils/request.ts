import axios from 'axios';
import { message } from 'antd';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    
    // 如果返回的不是标准格式，包装一下
    if (typeof data !== 'object') {
      return {
        code: 0,
        msg: 'success',
        data,
      };
    }
    
    return data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未登录或token失效
          message.error('请重新登录');
          // 清除token
          localStorage.removeItem('token');
          // 跳转到登录页
          window.location.href = '/login';
          break;
          
        case 403:
          message.error('没有权限');
          break;
          
        case 404:
          message.error('请求的资源不存在');
          break;
          
        case 500:
          message.error('服务器错误');
          break;
          
        default:
          message.error(data?.msg || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

export const request = async <T = any>(
  url: string,
  options?: {
    method?: string;
    data?: any;
    params?: any;
    headers?: Record<string, string>;
  }
): Promise<T> => {
  try {
    const response = await instance({
      url,
      method: options?.method || 'GET',
      data: options?.data,
      params: options?.params,
      headers: options?.headers,
    });
    return response as T;
  } catch (error) {
    throw error;
  }
}; 