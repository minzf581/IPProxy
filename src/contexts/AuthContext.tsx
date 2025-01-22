import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/user';
import { getCurrentUser, login as authLogin } from '@/services/auth';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Auth Debug]', ...args);
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// 导出 AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 导出 AuthProvider 组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  debug.log('AuthProvider mounted');

  const checkAuth = useCallback(async () => {
    try {
      debug.log('Checking authentication status...');
      setLoading(true);
      const currentUser = await getCurrentUser();
      debug.log('Current user check result:', currentUser);
      if (currentUser) {
        setUser(currentUser);
        debug.log('User authenticated:', currentUser);
      } else {
        setUser(null);
        debug.log('No authenticated user found');
      }
    } catch (error) {
      debug.error('Error checking authentication:', error);
      setUser(null);
    } finally {
      setLoading(false);
      debug.log('Authentication check complete, loading:', false);
    }
  }, []);

  useEffect(() => {
    debug.log('Initial authentication check');
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    try {
      debug.log('Login attempt for user:', username);
      setLoading(true);
      const response = await authLogin(username, password);
      debug.log('Login response:', response);

      if (response.code === 0 && response.data.token && response.data.user) {
        debug.log('Login successful, setting token and user');
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        debug.log('User state updated:', response.data.user);
      } else {
        debug.error('Invalid login response:', response);
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      debug.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
      debug.log('Login process complete, loading:', false);
    }
  };

  const logout = useCallback(() => {
    debug.log('Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    debug.log('User logged out, state cleared');
  }, []);

  useEffect(() => {
    debug.log('Auth state:', { user, isAuthenticated: !!user, loading });
  }, [user, loading]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 导出 useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
