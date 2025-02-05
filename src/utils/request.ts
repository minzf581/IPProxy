import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';
import { API_BASE_URL, API_CONFIG } from '@/config/api';

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: '/api', // 设置基础路径
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 获取 token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 处理错误响应
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('未授权，请重新登录');
          // 清除 token 并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error(data?.message || '服务器错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

// 封装请求方法
const request = {
  get: async <T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] GET 请求:', { 
      url, 
      config,
      timestamp: new Date().toISOString()
    });
    const response = await api.get(url, config);
    console.log('[Request Debug] GET 响应:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
  
  post: async <T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] POST 请求:', { 
      url, 
      data,
      config,
      timestamp: new Date().toISOString()
    });
    const response = await api.post(url, data, config);
    console.log('[Request Debug] POST 响应:', {
      status: response.status,
      statusText: response.statusText,
      data: {
        code: response.data.code,
        msg: response.data.msg,
        hasData: !!response.data.data,
        dataFields: response.data.data ? Object.keys(response.data.data) : []
      },
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
  
  put: async <T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] PUT 请求:', { 
      url, 
      data,
      config,
      timestamp: new Date().toISOString()
    });
    const response = await api.put(url, data, config);
    console.log('[Request Debug] PUT 响应:', {
      status: response.status,
      statusText: response.statusText,
      data: {
        code: response.data.code,
        msg: response.data.msg,
        hasData: !!response.data.data
      },
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
  
  delete: async <T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] DELETE 请求:', { 
      url, 
      config,
      timestamp: new Date().toISOString()
    });
    const response = await api.delete(url, config);
    console.log('[Request Debug] DELETE 响应:', {
      status: response.status,
      statusText: response.statusText,
      data: {
        code: response.data.code,
        msg: response.data.msg,
        hasData: !!response.data.data
      },
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
  
  patch: async <T = any>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] PATCH 请求:', { 
      url, 
      data,
      config,
      timestamp: new Date().toISOString()
    });
    const response = await api.patch(url, data, config);
    console.log('[Request Debug] PATCH 响应:', {
      status: response.status,
      statusText: response.statusText,
      data: {
        code: response.data.code,
        msg: response.data.msg,
        hasData: !!response.data.data
      },
      timestamp: new Date().toISOString()
    });
    return response.data;
  }
};

export { api }; 