import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import type { Agent } from '@/types/agent';

interface Props {
  visible: boolean;
  onCancel: () => void;
  agent: Agent | null;
}

const UpdateRemarkModal: React.FC<Props> = ({ visible, onCancel, agent }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // TODO: 调用API更新备注
      message.success('备注更新成功');
      onCancel();
      form.resetFields();
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  return (
    <Modal
      title="编辑备注"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ remark: agent?.remark }}>
        <Form.Item name="remark" label="备注">
          <Input.TextArea placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateRemarkModal; 