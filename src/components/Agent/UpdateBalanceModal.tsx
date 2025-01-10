import React from 'react';
import { Modal, Form, InputNumber, Radio, message } from 'antd';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateBalanceModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // TODO: 调用API更新余额
      message.success('余额调整成功');
      onSuccess();
      form.resetFields();
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  return (
    <Modal
      title="调整余额"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label="操作类型"
          rules={[{ required: true, message: '请选择操作类型' }]}
        >
          <Radio.Group>
            <Radio value="increase">增加</Radio>
            <Radio value="decrease">扣减</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="amount"
          label="金额"
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <InputNumber
            min={0}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入金额"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateBalanceModal;