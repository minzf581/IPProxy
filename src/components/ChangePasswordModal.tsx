import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { updateUserPassword } from '@/services/userService';

interface ChangePasswordModalProps {
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

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await updateUserPassword(userId, values.password);
      
      if (response.code === 0) {
        message.success('密码修改成功');
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.msg || '密码修改失败');
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      message.error('密码修改失败');
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能小于6位' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
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
          <Input.Password placeholder="请再次输入密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal; 