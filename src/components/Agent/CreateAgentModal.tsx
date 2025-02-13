import React from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { createAgent } from '@/services/agentService';
import type { CreateAgentForm } from '@/types/agent';
import { debug } from '@/utils/debug';

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

      debug.log('Form values:', {
        ...values,
        password: '******'
      });

      // 准备请求数据
      const requestData: CreateAgentForm = {
        username: values.username,
        password: values.password,
        email: values.email?.trim() || undefined,  // 如果为空字符串，则设为undefined
        balance: values.balance || 1000.0,  // 使用默认值1000
        phone: values.phone?.trim() || undefined,  // 修改为 phone
        remark: values.remark?.trim() || undefined,
        status: 'active'
      };

      debug.log('Request data:', {
        ...requestData,
        password: '******'
      });

      const response = await createAgent(requestData);
      debug.log('API response:', response);

      if (response.code === 0 && response.data) {
        message.success('创建代理商成功');
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        message.error(response.msg || '创建代理商失败');
      }
    } catch (error: any) {
      debug.error('创建代理商失败:', error);
      if (error.response?.data?.msg) {
        message.error(error.response.data.msg);
      } else {
        message.error(error.message || '创建代理商失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗显示时，设置默认值
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        balance: 1000.0  // 设置默认余额
      });
    }
  }, [visible, form]);

  return (
    <Modal
      title="创建代理商"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      maskClosable={false}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
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
          name="email"
          label="邮箱"
          rules={[
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱（选填，默认使用系统生成）" allowClear />
        </Form.Item>

        <Form.Item
          name="balance"
          label="初始余额"
          rules={[
            { type: 'number', min: 0, message: '余额不能小于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            placeholder="请输入初始余额（默认1000）"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="联系方式"
          rules={[
            { pattern: /^[\d\-+() ]{5,20}$/, message: '请输入有效的联系方式' }
          ]}
        >
          <Input placeholder="请输入联系方式（选填）" allowClear />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入备注信息（选填）"
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAgentModal;