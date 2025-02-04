import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/user';
import { getCurrentUser, login as authLogin } from '@/services/auth';
import { USER_ROLE } from '@/utils/constants';

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
        return;
      }

      const response = await getCurrentUser();
      debug.log('Current user check result:', response);
      
      if (response.code === 0 && response.data) {
        setUser(response.data);
        debug.log('User authenticated:', response.data);
      } else {
        setUser(null);
        localStorage.removeItem('token');
        debug.log('No authenticated user found');
      }
    } catch (error) {
      debug.error('Error checking authentication:', error);
      setUser(null);
      localStorage.removeItem('token');
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

      if (response.code === 0 && response.data) {
        const { token, user } = response.data;
        if (!token || !user) {
          debug.error('Invalid login response data:', response.data);
          throw new Error('登录响应数据不完整');
        }
        
        debug.log('Login successful, setting token');
        localStorage.setItem('token', token);
        setUser(user);
        debug.log('User state updated:', user);
      } else {
        debug.error('Login failed:', response);
        throw new Error(response.msg || '登录失败');
      }
    } catch (error: any) {
      debug.error('Login failed:', error);
      // 确保清理任何可能存在的无效 token
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
    setInitialized(false); // 重置初始化状态，允许下次登录时重新检查
    debug.log('User logged out, state cleared');
  }, []);

  // 只在开发环境下记录状态变化
  useEffect(() => {
    if (import.meta.env.DEV) {
      debug.log('Auth state:', { 
        user, 
        isAuthenticated: !!user,
        isAdmin: user?.is_admin ?? false,
        isAgent: user?.is_agent ?? false,
        loading,
        initialized
      });
    }
  }, [user, loading, initialized]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    isAdmin: user?.is_admin ?? false,
    isAgent: user?.is_agent ?? false,
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
