import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig
} from 'axios';
import { API_BASE } from '@/shared/routes';

// 公开路径列表
const PUBLIC_PATHS = [
  '/auth/login',
  '/open/app/area/v2',
  '/open/app/city/list/v2',
  '/open/app/order/v2',
  '/open/app/location/options/v2'
];

// 创建 axios 实例
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    const url = config.url || '';
    const isPublicPath = PUBLIC_PATHS.some(path => url.includes(path));
    
    console.log('[Request Debug] URL:', url);
    console.log('[Request Debug] Is Public Path:', isPublicPath);
    console.log('[Request Debug] Token:', token ? 'exists' : 'not found');
    
    // 添加token（如果存在）
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    
    // 如果返回的code不是0，说明有错误
    if (data && data.code !== 0) {
      // 如果是401，说明token无效或过期
      if (data.code === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(new Error(data.msg || '未授权，请重新登录'));
      }
      // 其他错误直接reject
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
    
    return data;
  },
  (error) => {
    console.error('[Response Error]', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 导出请求方法
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    api.get<T, T>(url, config),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    api.post<T, T>(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    api.put<T, T>(url, data, config),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    api.delete<T, T>(url, config),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    api.patch<T, T>(url, data, config)
};

export default request; 