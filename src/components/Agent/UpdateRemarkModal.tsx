import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { agentService } from '@/services/agentService';
import type { AgentInfo } from '@/types/agent';

interface Props {
  visible: boolean;
  onCancel: () => void;
  agent: AgentInfo | null;
  onSuccess?: () => void;
}

const UpdateRemarkModal: React.FC<Props> = ({
  visible,
  onCancel,
  agent,
  onSuccess
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!agent) {
        message.error('代理商信息不存在');
        return;
      }

      await agentService.updateAgent(agent.id, {
        remark: values.remark
      });

      message.success('备注更新成功');
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('更新备注失败:', error);
      message.error('更新备注失败');
    }
  };

  return (
    <Modal
      title="更新备注"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          remark: agent?.remark || ''
        }}
      >
        <Form.Item
          name="remark"
          label="备注"
          rules={[{ required: true, message: '请输入备注' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateRemarkModal;