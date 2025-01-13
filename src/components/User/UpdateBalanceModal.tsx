import React from 'react';
import { Modal, Form, InputNumber, Input, message } from 'antd';
import { updateUser } from '@/services/userService';
import type { UserInfo } from '@/types/user';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: UserInfo;
}

const UpdateBalanceModal: React.FC<Props> = ({
  visible,
  onClose,
  user
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const newBalance = user.balance + values.amount;
      if (newBalance < 0) {
        message.error('余额不能小于0');
        return;
      }

      await updateUser(user.id, {
        balance: newBalance,
        balanceRemark: values.remark
      });

      message.success('余额更新成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Failed to update balance:', error);
      message.error('更新余额失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改余额"
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
        initialValues={{ amount: 0, remark: '' }}
      >
        <Form.Item
          label="当前余额"
        >
          <InputNumber
            disabled
            style={{ width: '100%' }}
            precision={2}
            value={user.balance}
            prefix="¥"
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="变更金额"
          rules={[
            { required: true, message: '请输入变更金额' },
            { type: 'number', message: '请输入有效金额' }
          ]}
          extra="正数表示充值，负数表示扣除"
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            prefix="¥"
            placeholder="请输入变更金额"
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
          rules={[{ required: true, message: '请输入备注' }]}
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

export default UpdateBalanceModal;
