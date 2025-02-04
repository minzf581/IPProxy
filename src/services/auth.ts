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
    
    if (!responseData || typeof responseData !== 'object') {
      debug.error('响应格式无效:', {
        response: responseData,
        type: typeof responseData,
        timestamp: new Date().toISOString()
      });
      throw new Error('登录响应格式错误');
    }

    const { token, user } = responseData;
    if (!token || !user) {
      debug.error('响应数据不完整:', {
        hasToken: !!token,
        hasUser: !!user,
        timestamp: new Date().toISOString()
      });
      throw new Error('登录响应数据不完整');
    }

    debug.log('登录成功:', {
      tokenLength: token.length,
      userFields: Object.keys(user),
      timestamp: new Date().toISOString()
    });
    
    // 保存 token 到 localStorage
    localStorage.setItem('token', token);
    
    return {
      code: 0,
      msg: '登录成功',
      data: responseData
    };
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
    const { data: apiResponse } = await api.get<ApiResponse<User>>('/auth/current-user');
    debug.log('当前用户响应:', apiResponse);
    
    if (apiResponse.code !== 0) {
      debug.warn('获取用户信息失败:', {
        code: apiResponse.code,
        message: apiResponse.msg,
        timestamp: new Date().toISOString()
      });
      return {
        code: apiResponse.code,
        msg: apiResponse.msg,
        data: null
      };
    }
    
    if (!apiResponse.data) {
      debug.warn('无用户数据:', {
        timestamp: new Date().toISOString()
      });
      return {
        code: 0,
        msg: 'success',
        data: null
      };
    }
    
    debug.log('获取用户信息成功:', {
      userFields: Object.keys(apiResponse.data),
      timestamp: new Date().toISOString()
    });
    return apiResponse;
  } catch (error: any) {
    debug.error('获取用户信息出错:', {
      error,
      message: error.message,
      response: error.response,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const logout = () => {
  debug.log('注销用户');
  localStorage.removeItem('token');
};

export const updatePassword = async (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
  try {
    debug.log('更新密码');
    const { data: apiResponse } = await api.post<ApiResponse<void>>('/auth/password', data);
    debug.log('更新密码响应:', apiResponse);
    
    if (apiResponse.code !== 0) {
      debug.error('更新密码失败:', {
        code: apiResponse.code,
        message: apiResponse.msg,
        timestamp: new Date().toISOString()
      });
      throw new Error(apiResponse.msg || '更新密码失败');
    }
    
    return apiResponse;
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