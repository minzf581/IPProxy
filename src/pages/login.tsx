import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/services/auth';
import styles from './login.module.less';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await login(values.username, values.password);
      
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        message.success('登录成功');
        navigate('/', { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        <h1>登录</h1>
        <Form
          form={form}
          name="login"
          initialValues={{ username: 'ipadmin', password: 'ipadmin' }}
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
