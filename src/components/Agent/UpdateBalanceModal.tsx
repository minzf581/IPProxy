import React from 'react';
import { Modal, Form, InputNumber, Input, message } from 'antd';
import { updateAgent } from '@/services/agentService';

interface UpdateBalanceModalProps {
  visible: boolean;
  agentId: number;
  currentBalance: number;
  onClose: () => void;
}

const UpdateBalanceModal: React.FC<UpdateBalanceModalProps> = ({
  visible,
  agentId,
  currentBalance,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await updateAgent(agentId, {
        balance: currentBalance + values.amount,
        lastRechargeAmount: values.amount,
        lastRechargeRemark: values.remark
      });

      message.success('余额更新成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Failed to update balance:', error);
      message.error('余额更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改余额"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="amount"
          label="变更金额"
          rules={[
            { required: true, message: '请输入变更金额' },
            { type: 'number', message: '请输入有效的金额' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入变更金额（正数为充值，负数为扣除）"
            precision={2}
          />
        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[{ required: true, message: '请输入备注' }]}
        >
          <Input.TextArea placeholder="请输入备注信息" rows={4} />
        </Form.Item>
        <div style={{ marginBottom: 16 }}>
          <p>当前余额：{currentBalance}</p>
          <p>变更后余额：{currentBalance + (form.getFieldValue('amount') || 0)}</p>
        </div>
      </Form>
    </Modal>
  );
};

export default UpdateBalanceModal;