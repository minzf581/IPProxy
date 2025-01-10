import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import type { CreateAgentForm } from '@/types/agent';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: CreateAgentForm) => void;
}

const CreateAgentModal: React.FC<Props> = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
      form.resetFields();
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  return (
    <Modal
      title="新建代理商"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="account"
          label="账号"
          rules={[
            { required: true, message: '请输入账号' },
            { pattern: /^[a-zA-Z0-9]+$/, message: '账号只能包含英文和数字' }
          ]}
        >
          <Input placeholder="请输入账号" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { pattern: /^[a-zA-Z0-9]+$/, message: '密码只能包含英文和数字' }
          ]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAgentModal; 