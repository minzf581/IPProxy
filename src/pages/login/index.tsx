import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import styles from './index.module.less';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[Login Debug ${timestamp}]`, ...args);
    const debugDiv = document.getElementById('debug-output');
    if (debugDiv) {
      const p = document.createElement('p');
      p.textContent = `${timestamp}: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ')}`;
      debugDiv.appendChild(p);
      debugDiv.scrollTop = debugDiv.scrollHeight;
    }
  },
  error: (...args: any[]) => {
    console.error('[Login Error]', ...args);
  },
  state: (...args: any[]) => {
    console.log('[Login State]', ...args);
    const debugDiv = document.getElementById('debug-output');
    if (debugDiv) {
      const p = document.createElement('p');
      p.style.color = 'blue';
      p.textContent = `[State] ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ')}`;
      debugDiv.appendChild(p);
    }
  },
  auth: (...args: any[]) => {
    console.log('[Login Auth]', ...args);
    const debugDiv = document.getElementById('debug-output');
    if (debugDiv) {
      const p = document.createElement('p');
      p.style.color = 'green';
      p.textContent = `[Auth] ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ')}`;
      debugDiv.appendChild(p);
    }
  }
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('ipadmin');
  const [password, setPassword] = useState('ipadmin');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();

  // 记录组件挂载
  useEffect(() => {
    debug.log('LoginPage mounted');
    debug.state('Initial state:', { username, password, isLoading });
    debug.auth('Initial auth state:', { user, loading });
    debug.log('Current location:', location);

    return () => {
      debug.log('LoginPage will unmount');
    };
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    debug.auth('Auth state changed:', { user, loading });
  }, [user, loading]);

  // 如果用户已登录，直接跳转到首页
  useEffect(() => {
    if (user) {
      debug.log('User already logged in, redirecting to home');
      debug.auth('Redirect triggered by user:', user);
      debug.log('Navigation state:', { pathname: '/', replace: true });
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    debug.log('Form submitted');
    debug.state('Submit state:', { username, password, isLoading });

    try {
      debug.log('Starting login process');
      setIsLoading(true);
      debug.state('Loading state set to true');

      debug.log('Calling login function');
      await login(username, password);
      debug.log('Login function completed');
      debug.auth('Post-login auth state:', { user, loading });

      debug.log('Login successful');
      message.success('登录成功');

      debug.log('Initiating navigation to home');
      navigate('/', { replace: true });
      debug.log('Navigation initiated');
    } catch (error) {
      debug.error('Login failed:', error);
      debug.state('Error state:', { error });
      message.error('登录失败：' + (error as Error).message);
    } finally {
      setIsLoading(false);
      debug.state('Loading state set to false');
      debug.log('Login process complete');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1>登录</h1>
        
        {/* 调试面板 */}
        <div id="debug-output" style={{
          maxHeight: '200px',
          overflow: 'auto',
          marginBottom: '20px',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: '#f5f5f5',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '10px', borderBottom: '1px solid #ccc', padding: '5px' }}>
            <strong>Debug Log</strong> (蓝色=状态变化, 绿色=认证状态)
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                debug.log('Username changed:', e.target.value);
                debug.state('Username updating to:', e.target.value);
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
                debug.log('Password changed');
                debug.state('Password updated');
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
