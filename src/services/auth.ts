import { apiRequest } from '@/utils/request';
import { User } from '@/types/user';
import type { ApiResponse } from '@/types/api';
import { API_ROUTES } from '@/shared/routes';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth Service Debug]', ...args);
    }
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

interface BackendResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export const login = async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
  try {
    debug.log('开始登录请求:', { username, timestamp: new Date().toISOString() });
    
    // 创建 FormData
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const { data: backendResponse } = await apiRequest.post<BackendResponse<LoginResponse>>(
      API_ROUTES.AUTH.LOGIN,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    debug.log('收到登录响应:', backendResponse);
    
    if (backendResponse.code === 0 && backendResponse.data) {
      // 保存 token 到 localStorage
      localStorage.setItem('token', backendResponse.data.token);
      debug.log('Token已保存到localStorage');
      
      return {
        code: 200,  // 转换为前端标准状态码
        message: backendResponse.msg || '登录成功',
        data: backendResponse.data
      };
    }
    
    // 登录失败的情况
    const errorMessage = backendResponse.msg || '登录失败';
    debug.error('登录失败:', errorMessage);
    throw new Error(errorMessage);
    
  } catch (error: any) {
    debug.error('登录请求失败:', error);
    // 尝试从错误响应中获取详细信息
    const errorMessage = error.response?.data?.msg || error.message || '登录失败';
    throw new Error(errorMessage);
  }
};

export const getCurrentUser = async (): Promise<ApiResponse<User | null>> => {
  try {
    debug.log('获取当前用户信息');
    const token = localStorage.getItem('token');
    
    if (!token) {
      debug.warn('未找到token，用户可能未登录');
      return {
        code: 401,
        message: '未登录',
        data: null
      };
    }

    const { data: backendResponse } = await apiRequest.get<BackendResponse<User>>('/api/auth/current-user');
    debug.log('获取用户信息成功:', backendResponse);
    
    if (backendResponse.code === 0) {
      return {
        code: 200,
        message: backendResponse.msg || '获取用户信息成功',
        data: backendResponse.data
      };
    }
    
    throw new Error(backendResponse.msg || '获取用户信息失败');
    
  } catch (error: any) {
    debug.error('获取用户信息失败:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    throw new Error(error.response?.data?.msg || error.message || '获取用户信息失败');
  }
};

export const logout = () => {
  debug.log('注销用户');
  localStorage.removeItem('token');
};

export const updatePassword = async (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
  try {
    debug.log('更新密码');
    const { data: backendResponse } = await apiRequest.post<BackendResponse<void>>(
      '/api/auth/password',
      data
    );
    debug.log('密码更新成功');
    
    if (backendResponse.code === 0) {
      return {
        code: 200,
        message: backendResponse.msg || '密码更新成功',
        data: undefined
      };
    }
    
    throw new Error(backendResponse.msg || '更新密码失败');
    
  } catch (error: any) {
    debug.error('更新密码失败:', error);
    throw new Error(error.response?.data?.msg || error.message || '更新密码失败');
  }
}; 