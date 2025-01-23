import React from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import { updateAgent } from '@/services/agentService';

interface Props {
  visible: boolean;
  agent: {
    id: number;
    balance: number;
  };
  onClose: () => void;
}

const UpdateQuotaModal: React.FC<Props> = ({ visible, agent, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && agent) {
      form.setFieldsValue({
        balance: agent.balance
      });
    }
  }, [visible, agent]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await updateAgent(agent.id, {
        balance: values.balance
      });
      
      message.success('额度调整成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('调整额度失败:', error);
      message.error('调整额度失败');
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
      title="调整额度"
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
          label="当前额度"
        >
          <span>¥{agent.balance.toFixed(2)}</span>
        </Form.Item>

        <Form.Item
          label="调整后额度"
          name="balance"
          rules={[
            { required: true, message: '请输入调整后额度' },
            { type: 'number', min: 0, message: '额度不能小于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入调整后额度"
            min={0}
            step={100}
            precision={2}
            prefix="¥"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateQuotaModal; 