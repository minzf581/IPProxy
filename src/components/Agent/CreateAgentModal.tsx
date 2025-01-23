import React from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { createAgent } from '@/services/agentService';
import type { CreateAgentForm } from '@/types/agent';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateAgentModal: React.FC<Props> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await createAgent({
        username: values.username,
        password: values.password,
        balance: values.balance,
        contact: values.contact,
        remark: values.remark,
        status: values.status
      });

      message.success('创建代理商成功');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error) {
      console.error('创建代理商失败:', error);
      message.error('创建代理商失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新增代理商"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: true
        }}
      >
        <Form.Item
          label="账号"
          name="username"
          rules={[
            { required: true, message: '请输入账号' },
            { min: 4, message: '账号长度不能小于4位' },
            { max: 20, message: '账号长度不能大于20位' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '账号只能包含字母、数字和下划线' }
          ]}
        >
          <Input placeholder="请输入账号" />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度不能小于6位' },
            { max: 20, message: '密码长度不能大于20位' }
          ]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item
          label="初始额度"
          name="balance"
          rules={[
            { required: true, message: '请输入初始额度' },
            { type: 'number', min: 0, message: '初始额度不能小于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入初始额度"
            min={0}
            step={100}
            precision={2}
            prefix="¥"
          />
        </Form.Item>

        <Form.Item
          label="联系方式"
          name="contact"
        >
          <Input placeholder="请输入联系方式（选填）" />
        </Form.Item>

        <Form.Item
          label="备注"
          name="remark"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入备注信息（选填）"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="状态"
          name="status"
          valuePropName="checked"
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAgentModal;