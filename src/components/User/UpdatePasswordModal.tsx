import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import type { UserInfo } from '@/utils/ipProxyAPI';
import ipProxyAPI from '@/utils/ipProxyAPI';

interface UpdatePasswordModalProps {
  visible: boolean;
  user: UserInfo | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!user) {
        message.error('用户信息不存在');
        return;
      }

      setLoading(true);
      await ipProxyAPI.updateUserPassword(user.id, values.password);
      onSuccess();
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('修改密码失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能小于6位' },
            { max: 20, message: '密码长度不能大于20位' }
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
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdatePasswordModal;