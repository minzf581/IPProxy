import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { agentService } from '@/services/agentService';
import type { CreateAgentForm } from '@/types/agent';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const CreateAgentModal: React.FC<Props> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm<CreateAgentForm>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await agentService.createAgent(values);

      message.success('代理商创建成功');
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('创建代理商失败:', error);
      message.error('创建代理商失败');
    }
  };

  return (
    <Modal
      title="创建代理商"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="account"
          label="账号"
          rules={[
            { required: true, message: '请输入账号' },
            { min: 4, message: '账号长度不能小于4位' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度不能小于6位' }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="name"
          label="名称"
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAgentModal;