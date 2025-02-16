import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// 自定义API错误类型
class ApiError extends Error {
  response?: AxiosResponse;
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, ''),  // 移除末尾的斜杠
  timeout: 30000,  // 增加超时时间到 30 秒
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Debug 函数
const debug = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Request Debug]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[Request Error]', ...args);
  }
};

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 处理重复的api前缀
    if (config.url?.startsWith('/api/api/')) {
      debug.log('检测到重复的api前缀:', config.url);
      config.url = config.url.replace('/api/api/', '/api/');
      debug.log('处理后的URL:', config.url);
    }

    return config;
  },
  (error: AxiosError) => {
    debug.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

interface ApiResponseData {
  code?: number;
  message?: string;
  msg?: string;
  data?: unknown;
}

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponseData>) => {
    const { data } = response;
    console.log('[API Response]', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: data
    });
    
    // 统一处理成功响应
    // 1. 标准格式：code === 0
    // 2. HTTP成功：code === 200
    // 3. 无code但有data：兼容旧接口
    if (
      data.code === 0 || 
      data.code === 200 ||
      (data.data && !data.code)
    ) {
      // 统一转换为标准格式
      response.data = {
        code: 0,
        message: data.message || data.msg || '操作成功',
        data: data.data
      };
      return response;
    }
    
    // 处理错误响应
    const errorMessage = data.message || data.msg || '请求失败';
    const error = new ApiError(errorMessage);
    error.response = response;
    console.error('[API Error]', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      error: data
    });
    throw error;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error('[API Error Response]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data
      });
      
      // 处理401未授权错误
      if (error.response.status === 401) {
        localStorage.removeItem('token');  // 清除失效的token
        window.location.href = '/login';  // 重定向到登录页
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }
      
      // 处理其他HTTP错误
      const errorMessage = (error.response.data as ApiResponseData)?.message || 
                          (error.response.data as ApiResponseData)?.msg || 
                          '请求失败';
      throw new Error(errorMessage);
    } else if (error.request) {
      console.error('[API Network Error]', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
      throw new Error('网络错误，请检查网络连接');
    } else {
      console.error('[API Error]', error.message);
      throw error;
    }
  }
);

// 为了保持兼容性，导出多个别名
export const api = request;
export const apiRequest = request;
export default request;