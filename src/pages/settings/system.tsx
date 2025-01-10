import React from 'react';
import { Form, Input, Button } from 'antd';

const SystemSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Success:', values);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>修改管理员密码</h2>
      <div style={{ maxWidth: '400px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label={<span style={{ color: '#666' }}>当前密码</span>}
            name="currentPassword"
            required
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: '#666' }}>新密码</span>}
            name="newPassword"
            required
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: '#666' }}>确认新密码</span>}
            name="confirmPassword"
            required
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SystemSettings;
