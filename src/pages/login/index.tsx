import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginForm) => {
    try {
      setLoading(true);
      
      // 本地验证用户名和密码
      if (values.username === 'ipadmin' && values.password === 'ipadmin') {
        // 生成一个模拟的 token
        const mockToken = 'admin_token_' + Date.now();
        await login(mockToken);
        message.success('登录成功');
        
        // 如果有来源页面，跳转回去，否则跳转到首页
        const from = (location.state as any)?.from || '/';
        navigate(from, { replace: true });
      } else {
        message.error('用户名或密码错误');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-96">
        <h1 className="text-2xl font-bold text-center mb-8">IP总管理后台</h1>
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            username: 'ipadmin',
            password: 'ipadmin'
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名长度不能小于3位' },
              { max: 20, message: '用户名长度不能大于20位' },
            ]}
          >
            <Input disabled={loading} />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能小于6位' },
              { max: 20, message: '密码长度不能大于20位' },
            ]}
          >
            <Input.Password disabled={loading} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
