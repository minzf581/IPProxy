import React from 'react';
import { Modal, Form, Select, InputNumber, Input } from 'antd';
import type { User } from '@/types/user';

interface BusinessActivationModalProps {
  visible: boolean;
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const BusinessActivationModal: React.FC<BusinessActivationModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 处理业务开通逻辑
      onSuccess();
    } catch (error) {
      console.error('业务开通表单验证失败:', error);
    }
  };

  return (
    <Modal
      title="业务开通"
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
        <Form.Item label="用户账号">
          <Input value={user.username} disabled />
        </Form.Item>
        <Form.Item
          name="businessType"
          label="业务类型"
          rules={[{ required: true, message: '请选择业务类型' }]}
        >
          <Select>
            <Select.Option value="type1">业务类型1</Select.Option>
            <Select.Option value="type2">业务类型2</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="amount"
          label="开通数量"
          rules={[{ required: true, message: '请输入开通数量' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BusinessActivationModal; 