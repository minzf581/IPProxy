import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { updateUser } from '@/services/userService';
import { hashPassword } from '@/utils/crypto';

interface UpdatePasswordModalProps {
  visible: boolean;
  userId: number;
  onClose: () => void;
}

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  visible,
  userId,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const hashedOldPassword = await hashPassword(values.oldPassword);
      const hashedNewPassword = await hashPassword(values.newPassword);

      await updateUser(userId, {
        oldPassword: hashedOldPassword,
        password: hashedNewPassword
      });

      message.success('密码更新成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Failed to update password:', error);
      message.error('密码更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="oldPassword"
          label="原密码"
          rules={[{ required: true, message: '请输入原密码' }]}
        >
          <Input.Password placeholder="请输入原密码" />
        </Form.Item>
        <Form.Item
          name="newPassword"
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
          label="确认新密码"
          rules={[
            { required: true, message: '请确认新密码' },
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
      </Form>
    </Modal>
  );
};

export default UpdatePasswordModal;