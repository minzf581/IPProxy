import React from 'react';
import { Modal, Form, Input, message } from 'antd';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdatePasswordModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      // TODO: 调用API更新密码
      message.success('密码修改成功');
      onSuccess();
      form.resetFields();
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  return (
    <Modal
      title="修改密码"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { pattern: /^[a-zA-Z0-9]+$/, message: '密码只能包含英文和数字' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认密码"
          rules={[{ required: true, message: '请再次输入新密码' }]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdatePasswordModal;