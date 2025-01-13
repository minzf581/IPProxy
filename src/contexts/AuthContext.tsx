import React, { createContext, useContext, useState, useEffect } from 'react';
import ipProxyAPI from '@/utils/ipProxyAPI';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  // 初始化认证状态
  const initializeAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // 设置 token 到 API 实例
        ipProxyAPI.setToken(token);
        // 获取用户信息
        const userInfo = await ipProxyAPI.getCurrentUser();
        setUser(userInfo);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        // 如果获取用户信息失败，清除无效的 token
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const handleLogin = async (token: string) => {
    try {
      localStorage.setItem('token', token);
      ipProxyAPI.setToken(token);
      const userInfo = await ipProxyAPI.getCurrentUser();
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('登录失败:', error);
      localStorage.removeItem('token');
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    ipProxyAPI.setToken('');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
