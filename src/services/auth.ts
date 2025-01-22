import { api } from '@/utils/request';
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
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  debug.log('Login request with username:', username);
  debug.log('API endpoint:', '/api/auth/login');
  try {
    const response = await api.post<LoginResponse>('/api/auth/login', { username, password });
    debug.log('Raw login response:', response);
    debug.log('Response status:', response.status);
    debug.log('Response data:', response.data);
    
    return response.data;
  } catch (error: any) {
    debug.error('Login error:', error);
    debug.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  debug.log('Fetching current user');
  debug.log('API endpoint:', '/api/auth/current-user');

  try {
    const response = await api.get<{ code: number; message: string; data: User }>('/api/auth/current-user');

    debug.log('Current user response:', {
      status: response.status,
      code: response.data.code,
      message: response.data.message,
      hasUser: !!response.data.data,
      userData: response.data.data
    });

    return response.data.data;
  } catch (error: any) {
    debug.error('Get current user error:', error);
    debug.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const logout = () => {
  debug.log('Logging out');
  localStorage.removeItem('token');
};

export const updatePassword = async (data: { oldPassword: string; newPassword: string }) => 
  api.post('/auth/password', data); 