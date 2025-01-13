import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { updateUser } from '@/services/userService';
import type { UserInfo } from '@/types/user';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: UserInfo;
}

const UpdateUserModal: React.FC<Props> = ({
  visible,
  onClose,
  user
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        remark: user.remark
      });
    }
  }, [visible, user]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await updateUser(user.id, values);

      message.success('用户信息更新成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      message.error('更新用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="编辑用户"
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
            { max: 20, message: '用户名最多20个字符' }
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入备注信息"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateUserModal;
