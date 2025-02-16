import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/user';
import { getCurrentUser, login as authLogin } from '@/services/auth';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[Auth Debug]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[Auth Error]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[Auth Warning]', ...args);
  }
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isUser: boolean;
  role: UserRole | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// 导出 AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 导出 AuthProvider 组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  debug.log('AuthProvider mounted');

  // 确定用户角色
  const determineUserRole = (userData: User): UserRole => {
    if (userData.is_admin) return UserRole.ADMIN;
    if (userData.is_agent) return UserRole.AGENT;
    return UserRole.USER;
  };

  const checkAuth = useCallback(async () => {
    // 如果已经初始化过，不再重复检查
    if (initialized) {
      debug.log('Auth already initialized, skipping check');
      return;
    }

    try {
      debug.log('Checking authentication status...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        debug.log('No token found, skipping auth check');
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      const response = await getCurrentUser();
      debug.log('Current user check result:', response);
      
      if (response.code === 0 && response.data) {
        const userData = {
          ...response.data,
          role: determineUserRole(response.data)
        };
        setUser(userData);
        debug.log('User authenticated:', userData);
      } else {
        debug.log('Authentication failed, clearing token and user');
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error: any) {
      debug.error('Error checking authentication:', error);
      // 如果是401错误，清除token和用户信息
      if (error.response?.status === 401) {
        debug.log('Unauthorized, clearing token and user');
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
      debug.log('Authentication check complete');
    }
  }, [initialized]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    try {
      debug.log('Login attempt for user:', username);
      setLoading(true);
      
      const response = await authLogin(username, password);
      debug.log('Login response:', response);

      if (response.code === 200 && response.data) {  // 前端已经转换为标准状态码 200
        const { token, user: userData } = response.data;
        if (!token || !userData) {
          debug.error('Invalid login response data:', response.data);
          throw new Error('登录响应数据不完整');
        }
        
        debug.log('Login successful, setting token and user');
        const userWithRole = {
          ...userData,
          role: determineUserRole(userData)
        };
        setUser(userWithRole);
        debug.log('User state updated:', userWithRole);
      } else {
        debug.error('Login failed:', response);
        throw new Error(response.message || '登录失败');
      }
    } catch (error: any) {
      debug.error('Login failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
      debug.log('Login process complete');
    }
  };

  const logout = useCallback(() => {
    debug.log('Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    setInitialized(false);
    debug.log('User logged out, state cleared');
  }, []);

  // 只在开发环境下记录状态变化
  useEffect(() => {
    if (import.meta.env.DEV) {
      debug.log('Auth state:', { 
        user, 
        isAuthenticated: !!user,
        isAdmin: user?.role === UserRole.ADMIN,
        isAgent: user?.role === UserRole.AGENT,
        isUser: user?.role === UserRole.USER,
        role: user?.role,
        loading,
        initialized
      });
    }
  }, [user, loading, initialized]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    isAdmin: user?.role === UserRole.ADMIN,
    isAgent: user?.role === UserRole.AGENT,
    isUser: user?.role === UserRole.USER,
    role: user?.role || null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 导出 useAuth hook
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, useAuth };
