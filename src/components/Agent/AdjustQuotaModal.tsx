import React from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import { adjustAgentQuota } from '@/services/agentService';

interface AdjustQuotaModalProps {
  visible: boolean;
  agentId: number;
  onClose: () => void;
}

const AdjustQuotaModal: React.FC<AdjustQuotaModalProps> = ({ visible, agentId, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const response = await adjustAgentQuota(agentId, values.quota);
      if (response.code === 0) {
        message.success('调整额度成功');
        form.resetFields();
        onClose();
      } else {
        message.error(response.message || '调整额度失败');
      }
    } catch (error) {
      console.error('调整额度失败:', error);
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
      title="调整代理商额度"
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
          label="调整额度"
          name="quota"
          rules={[
            { required: true, message: '请输入调整额度' },
            { type: 'number', message: '请输入有效的额度' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入调整额度"
            precision={2}
            step={100}
            prefix="¥"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdjustQuotaModal; 