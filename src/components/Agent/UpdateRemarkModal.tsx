import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { updateAgent } from '@/services/agentService';

interface UpdateRemarkModalProps {
  visible: boolean;
  agent: {
    id: number;
    remark: string | null | undefined;
  };
  onClose: () => void;
}

const UpdateRemarkModal: React.FC<UpdateRemarkModalProps> = ({ visible, agent, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && agent) {
      form.setFieldsValue({
        remark: agent.remark
      });
    }
  }, [visible, agent]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await updateAgent(agent.id, {
        remark: values.remark
      });
      
      message.success('备注更新成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('更新备注失败:', error);
      message.error('更新备注失败');
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
      title="修改备注"
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
          label="备注"
          name="remark"
          rules={[{ required: true, message: '请输入备注' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入备注"
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateRemarkModal;