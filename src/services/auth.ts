import { request } from '@/utils/request';
import { User } from '@/types/user';

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
  code: number;
  msg: string;
  data: {
    token: string;
    user: User;
  };
}

export const login = async (username: string, password: string): Promise<{ token: string; user: User }> => {
  debug.log('Login request:', { username, password: '[REDACTED]' });

  try {
    const response = await request.post<LoginResponse>('/auth/login', {
      username,
      password
    });

    debug.log('Login response:', {
      status: response.status,
      code: response.data.code,
      msg: response.data.msg,
      hasToken: !!response.data.data?.token,
      hasUser: !!response.data.data?.user
    });

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '登录失败');
    }

    return response.data.data;
  } catch (error) {
    debug.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  debug.log('Fetching current user');

  try {
    const response = await request.get<{ code: number; msg: string; data: User }>('/auth/current-user');

    debug.log('Current user response:', {
      status: response.status,
      code: response.data.code,
      msg: response.data.msg,
      hasUser: !!response.data.data
    });

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '获取用户信息失败');
    }

    return response.data.data;
  } catch (error) {
    debug.error('Get current user error:', error);
    throw error;
  }
};

export const logout = () => {
  debug.log('Logging out');
  localStorage.removeItem('token');
};

export const updatePassword = async (data: { oldPassword: string; newPassword: string }) => 
  request.post('/auth/password', data); 