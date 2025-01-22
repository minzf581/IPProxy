import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.less';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Login Page Debug]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[Login Page Error]', ...args);
  }
};

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  debug.log('Rendering login page');
  debug.log('Current location:', location);

  useEffect(() => {
    debug.log('Login page mounted');
    return () => {
      debug.log('Login page will unmount');
    };
  }, []);

  const onFinish = async (values: any) => {
    debug.log('Form submitted with values:', values);
    try {
      setLoading(true);
      debug.log('Starting login process');
      await login(values.username, values.password);
      debug.log('Login successful');
      message.success('登录成功');
      
      // 获取重定向路径
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      debug.log('Redirecting to:', from);
      navigate(from, { replace: true });
    } catch (error: any) {
      debug.error('Login failed:', error);
      message.error(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
      debug.log('Login process complete');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        <h1>登录</h1>
        <Form
          form={form}
          name="login"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
