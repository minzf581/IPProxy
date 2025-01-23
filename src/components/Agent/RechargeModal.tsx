import React from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import { rechargeAgent } from '@/services/agent';

interface RechargeModalProps {
  visible: boolean;
  agentId: number;
  onClose: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ visible, agentId, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const response = await rechargeAgent(agentId, values.amount);
      if (response.code === 0) {
        message.success('充值成功');
        form.resetFields();
        onClose();
      } else {
        message.error(response.message || '充值失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="代理商充值"
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
          label="充值金额"
          name="amount"
          rules={[
            { required: true, message: '请输入充值金额' },
            { type: 'number', min: 0.01, message: '充值金额必须大于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入充值金额"
            precision={2}
            min={0.01}
            step={100}
            prefix="¥"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RechargeModal; 