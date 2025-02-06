import { api } from '@/utils/request';
import { User } from '@/types/user';
import type { ApiResponse } from '@/types/api';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Auth Service Debug]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[Auth Service Error]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[Auth Service Warning]', ...args);
  }
};

interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
  try {
    debug.log('开始登录请求:', { username, timestamp: new Date().toISOString() });
    
    debug.log('发送登录请求到 API:', { 
      endpoint: '/auth/login',
      requestData: { username, password: '***' },
      timestamp: new Date().toISOString()
    });
    
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    const responseData = response.data;
    debug.log('收到原始响应:', responseData);
    
    // 检查响应是否包含必要的字段
    if (!responseData || !responseData.token || !responseData.user) {
      debug.error('响应数据不完整:', {
        hasToken: !!responseData?.token,
        hasUser: !!responseData?.user,
        timestamp: new Date().toISOString()
      });
      throw new Error('登录响应数据不完整');
    }

    // 将响应转换为标准格式
    const standardResponse: ApiResponse<LoginResponse> = {
      code: 0,
      msg: 'success',
      data: {
        token: responseData.token,
        user: responseData.user
      }
    };

    debug.log('登录成功:', {
      tokenLength: responseData.token.length,
      userFields: Object.keys(responseData.user),
      timestamp: new Date().toISOString()
    });
    
    // 保存 token 到 localStorage
    localStorage.setItem('token', responseData.token);
    
    return standardResponse;
  } catch (error: any) {
    debug.error('登录过程出错:', {
      errorType: error.constructor.name,
      message: error.message,
      hasResponse: !!error.response,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const getCurrentUser = async (): Promise<ApiResponse<User | null>> => {
  try {
    debug.log('获取当前用户信息');
    const response = await api.get<User>('/auth/current-user');
    const userData = response.data;
    debug.log('当前用户响应:', userData);
    
    // 将响应转换为标准格式
    return {
      code: 0,
      msg: 'success',
      data: userData
    };
  } catch (error: any) {
    debug.error('获取用户信息出错:', {
      error,
      message: error.message,
      response: error.response,
      timestamp: new Date().toISOString()
    });
    return {
      code: error.response?.status || 500,
      msg: error.message || '获取用户信息失败',
      data: null
    };
  }
};

export const logout = () => {
  debug.log('注销用户');
  localStorage.removeItem('token');
};

export const updatePassword = async (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
  try {
    debug.log('更新密码');
    const response = await api.post<void>('/auth/password', data);
    const result = response.data;
    debug.log('更新密码响应:', result);
    
    return {
      code: 0,
      msg: 'success',
      data: undefined
    };
  } catch (error: any) {
    debug.error('更新密码出错:', {
      error,
      message: error.message,
      response: error.response,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}; 