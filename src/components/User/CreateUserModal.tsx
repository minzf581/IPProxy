import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createUser } from '@/services/userService';
import { hashPassword } from '@/utils/crypto';
import type { CreateUserParams } from '@/services/userService';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
import { debug } from '@/utils/debug';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateUserModal: React.FC<Props> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      debug.log('Form values:', {
        ...values,
        password: '******',
        confirmPassword: '******'
      });

      const hashedPassword = await hashPassword(values.password);
      
      // 准备请求数据
      const requestData: CreateUserParams = {
        username: values.username,
        password: hashedPassword,
        ...(values.email?.trim() ? { email: values.email.trim() } : {}),
        ...(values.remark?.trim() ? { remark: values.remark.trim() } : {})
      };

      debug.log('Request data:', {
        ...requestData,
        password: '******'
      });

      const response = await createUser(requestData);
      debug.log('API response:', response);

      if (response.code === 0 && response.data) {
        message.success('用户创建成功');
        form.resetFields();
        onClose();
        onSuccess?.();
      } else {
        message.error(response.msg || '创建用户失败');
      }
    } catch (error: any) {
      debug.error('Failed to create user:', error);
      if (error.response?.data?.msg) {
        message.error(error.response.data.msg);
      } else if (error.message) {
        message.error(error.message);
      } else {
        message.error('创建用户失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="创建用户"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名最多20个字符' },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符' }
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱（可选）" allowClear />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' }
          ]}
        >
          <Input.Password placeholder="请输入密码" />
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

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入备注信息（可选）"
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;
