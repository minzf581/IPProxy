import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';
import { API_BASE_URL, API_CONFIG } from '@/config/api';

// 创建axios实例
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[Request Debug] 开始请求:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      headers: config.headers,
      timestamp: new Date().toISOString()
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Request Debug] 添加认证头:', {
        tokenLength: token.length,
        timestamp: new Date().toISOString()
      });
    }
    return config;
  },
  (error) => {
    console.error('[Request Debug] 请求拦截器错误:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    console.log('[Response Debug] 原始响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      hasData: !!response.data,
      dataType: typeof response.data,
      timestamp: new Date().toISOString()
    });

    if (response.data) {
      console.log('[Response Debug] 响应数据结构:', {
        isObject: typeof response.data === 'object',
        hasCode: 'code' in response.data,
        hasMsg: 'msg' in response.data,
        hasMessage: 'message' in response.data,
        hasData: 'data' in response.data,
        fields: Object.keys(response.data),
        timestamp: new Date().toISOString()
      });
    }
    
    // 如果响应数据不符合预期格式，包装成标准格式
    if (!response.data || typeof response.data !== 'object') {
      console.log('[Response Debug] 响应格式不标准，进行转换:', {
        originalData: response.data,
        timestamp: new Date().toISOString()
      });
      response.data = {
        code: 0,
        msg: 'success',
        data: response.data
      };
      return response;
    }
    
    // 如果响应中使用 message 而不是 msg，进行转换
    if (response.data.hasOwnProperty('message') && !response.data.hasOwnProperty('msg')) {
      console.log('[Response Debug] 转换 message 到 msg:', {
        originalMessage: response.data.message,
        timestamp: new Date().toISOString()
      });
      const { message, ...rest } = response.data;
      response.data = {
        ...rest,
        msg: message
      };
      return response;
    }
    
    // 确保响应包含所有必要的字段
    const result = { ...response.data };
    
    if (!result.hasOwnProperty('code')) {
      console.log('[Response Debug] 添加默认 code:', {
        timestamp: new Date().toISOString()
      });
      result.code = 0;
    }
    
    if (!result.hasOwnProperty('msg')) {
      console.log('[Response Debug] 添加默认 msg:', {
        timestamp: new Date().toISOString()
      });
      result.msg = 'success';
    }
    
    console.log('[Response Debug] 最终响应数据:', {
      code: result.code,
      msg: result.msg,
      hasData: !!result.data,
      timestamp: new Date().toISOString()
    });
    
    response.data = {
      code: result.code,
      msg: result.msg,
      data: result.data
    };
    
    return response;
  },
  (error) => {
    console.error('[Response Debug] 响应错误:', {
      errorType: error.constructor.name,
      message: error.message,
      hasResponse: !!error.response,
      responseStatus: error.response?.status,
      responseStatusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      },
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // 处理401错误（未授权/token过期）
    if (error.response?.status === 401) {
      console.log('[Response Debug] 处理401错误:', {
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });
      localStorage.removeItem('token');
      message.error('登录已过期，请重新登录');
      
      // 如果不是登录页面，则重定向到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else if (error.response?.data?.msg) {
      message.error(error.response.data.msg);
    } else {
      message.error('请求失败，请稍后重试');
    }

    return Promise.reject(error);
  }
);

// 封装请求方法
const request = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] GET 请求:', { 
      url, 
      config,
      timestamp: new Date().toISOString()
    });
    const response = await instance.get(url, config);
    console.log('[Request Debug] GET 响应:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
  
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] POST 请求:', { 
      url, 
      data,
      config,
      timestamp: new Date().toISOString()
    });
    const response = await instance.post(url, data, config);
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
  
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] PUT 请求:', { 
      url, 
      data,
      config,
      timestamp: new Date().toISOString()
    });
    const response = await instance.put(url, data, config);
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
  
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] DELETE 请求:', { 
      url, 
      config,
      timestamp: new Date().toISOString()
    });
    const response = await instance.delete(url, config);
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
  
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('[Request Debug] PATCH 请求:', { 
      url, 
      data,
      config,
      timestamp: new Date().toISOString()
    });
    const response = await instance.patch(url, data, config);
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

export const api = request; 