import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
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
    if (data.code !== 0) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '请求失败';
    message.error(msg);
    return Promise.reject(error);
  }
);

// 请求函数
export const request = async <T = any>(
  url: string,
  options?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await instance(url, options);
    return response as T;
  } catch (error) {
    throw error;
  }
}; 