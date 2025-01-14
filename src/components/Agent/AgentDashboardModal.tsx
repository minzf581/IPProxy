import React from 'react';
import { Modal, Form, Input, Button } from 'antd';

interface AgentDashboardModalProps {
  visible: boolean;
  onClose: () => void;
  agentId: string;
}

const AgentDashboardModal: React.FC<AgentDashboardModalProps> = ({
  visible,
  onClose,
  agentId
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 处理表单提交
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title="代理商仪表盘"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          确定
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        {/* 表单内容 */}
      </Form>
    </Modal>
  );
};

export default AgentDashboardModal;