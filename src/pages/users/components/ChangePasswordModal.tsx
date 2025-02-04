import React from 'react';
import { Modal, Form, Input, Button, Space, message } from 'antd';
import { updateUserPassword } from '@/services/userService';

export interface ChangePasswordModalProps {
  visible: boolean;
  userId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  userId,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      const response = await updateUserPassword(userId, values.password);
      if (response.code === 0) {
        onSuccess();
      } else {
        message.error(response.msg || '修改密码失败');
      }
    } catch (error) {
      message.error('修改密码失败');
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能小于6位' }
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal; 