import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/services/auth';
import styles from './index.module.less';

// 在全局范围添加调试函数
(window as any).debugLogin = {
  log: function(...args: any[]) {
    const timestamp = new Date().toISOString();
    const debugDiv = document.getElementById('debug-output');
    if (debugDiv) {
      const p = document.createElement('p');
      p.textContent = `${timestamp}: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ')}`;
      debugDiv.appendChild(p);
      debugDiv.scrollTop = debugDiv.scrollHeight;
    }
    console.log(`[Debug ${timestamp}]`, ...args);
  },
  testLogin: async function() {
    try {
      this.log('Testing login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'ipadmin',
          password: 'ipadmin'
        })
      });
      this.log('Response status:', response.status);
      const data = await response.json();
      this.log('Response data:', data);
    } catch (error) {
      this.log('Error:', error);
    }
  },
  checkNetwork: async function() {
    try {
      this.log('Checking network...');
      const response = await fetch('/api');
      this.log('API root response:', response.status);
    } catch (error) {
      this.log('Network error:', error);
    }
  },
  checkLocalStorage: function() {
    try {
      this.log('Checking localStorage...');
      localStorage.setItem('test', 'test');
      const value = localStorage.getItem('test');
      this.log('localStorage test:', value);
      localStorage.removeItem('test');
    } catch (error) {
      this.log('localStorage error:', error);
    }
  }
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('ipadmin');
  const [password, setPassword] = useState('ipadmin');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // 组件加载时运行一些诊断
  useEffect(() => {
    (window as any).debugLogin.log('Component mounted');
    (window as any).debugLogin.checkLocalStorage();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    (window as any).debugLogin.log('Form submitted');

    try {
      (window as any).debugLogin.log('Starting login process');
      setIsLoading(true);

      const response = await login(username, password);
      (window as any).debugLogin.log('Login response:', response);

      if (response.token && response.user) {
        (window as any).debugLogin.log('Login successful');
        localStorage.setItem('token', response.token);
        setUser(response.user);
        message.success('登录成功');
        navigate('/', { replace: true });
      } else {
        (window as any).debugLogin.log('Invalid response:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      (window as any).debugLogin.log('Login failed:', error);
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1>登录</h1>
        
        {/* 调试面板 */}
        <div id="debug-output" style={{
          maxHeight: '150px',
          overflow: 'auto',
          marginBottom: '20px',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: '#f5f5f5',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}></div>

        {/* 调试按钮 */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => (window as any).debugLogin.testLogin()}
            style={{ marginRight: '10px' }}
          >
            Test Login API
          </button>
          <button
            type="button"
            onClick={() => (window as any).debugLogin.checkNetwork()}
          >
            Check Network
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                (window as any).debugLogin.log('Username changed:', e.target.value);
                setUsername(e.target.value);
              }}
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                (window as any).debugLogin.log('Password changed');
                setPassword(e.target.value);
              }}
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
