import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types/user';
import { getCurrentUser } from '@/services/auth';

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
  loading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  setUser: () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  debug.log('AuthProvider mounted');

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      debug.log('Auth initialization - Token:', !!token);

      if (!token) {
        debug.warn('No token found, skipping user fetch');
        setLoading(false);
        return;
      }

      try {
        debug.log('Fetching current user');
        const userData = await getCurrentUser();
        debug.log('User data received:', userData);

        // 验证用户数据
        if (!userData.id || !userData.username || !userData.role) {
          debug.error('Invalid user data:', userData);
          throw new Error('Invalid user data received');
        }

        // 验证用户角色
        if (!Object.values(UserRole).includes(userData.role)) {
          debug.error('Invalid user role:', userData.role);
          throw new Error('Invalid user role');
        }

        debug.log('Setting user data:', userData);
        setUser(userData);
      } catch (err) {
        debug.error('Auth initialization error:', err);
        setError(err as Error);
        // 如果获取用户信息失败，清除 token
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        debug.log('Auth initialization completed');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  debug.log('Auth state:', { user, loading, error });

  const value = {
    user,
    loading,
    error,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
