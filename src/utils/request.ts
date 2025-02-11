import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults
} from 'axios';
import { message } from 'antd';
import { API_ROUTES } from '@/shared/routes';
import { debug } from './debug';

// 调试开关
const DEBUG = import.meta.env.DEV;

// 创建axios实例的工厂函数
const createAxiosInstance = (config: CreateAxiosDefaults = {}): AxiosInstance => {
  const instance = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 打印原始URL
      if (DEBUG) {
        console.log('[Request Debug] Original URL:', config.url);
      }
      
      // 确保URL以/开头
      if (config.url && !config.url.startsWith('/')) {
        config.url = `/${config.url}`;
      }
      
      // 如果使用的是 client 实例（不带baseURL），则添加 /api 前缀
      if (!config.baseURL && config.url && !config.url.startsWith('/api/')) {
        config.url = `/api${config.url}`;
      }
      
      if (DEBUG) {
        console.log('[Request Debug] Processed URL:', config.url);
        console.log('[Request Debug] Final URL will be:', `${config.baseURL || ''}${config.url}`);
      }
      
      // 获取token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (DEBUG) {
          console.log('[Request Debug] Token added to headers');
        }
      } else if (DEBUG) {
        console.log('[Request Debug] No token found');
      }
      
      return config;
    },
    (error) => {
      console.error('[Request Error]', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const { data } = response;
      
      // 如果响应成功但业务状态码不为0
      if (data.code !== 0 && data.code !== 200) {
        if (data.code === 401) {
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(new Error('登录已过期'));
        }
        message.error(data.msg || '请求失败');
        return Promise.reject(new Error(data.msg || '请求失败'));
      }
      
      return response;
    },
    (error) => {
      console.error('[Response Error]', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            message.error('登录已过期，请重新登录');
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
            message.error('服务器错误');
            break;
          default:
            message.error(data?.msg || error.message || '请求失败');
        }
      } else {
        message.error('网络错误，请检查网络连接');
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// 创建带有 /api 前缀的实例
const api = createAxiosInstance();

// 创建不带前缀的实例，用于直接访问完整URL
const client = createAxiosInstance({ baseURL: '' });

// 创建请求方法工厂函数
const createRequestMethods = (instance: AxiosInstance) => ({
  get: <T = any>(url: string, config?: any) => instance.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => instance.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => instance.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => instance.delete<T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: any) => instance.patch<T>(url, data, config)
});

// 导出请求方法
const request = createRequestMethods(api);
const apiRequest = createRequestMethods(client);

export { api, client, apiRequest };
export default request; 