import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';
import { createProxyUser } from '@/services/api';

interface CreateProxyModalProps {
  onSuccess?: () => void;
}

const CreateProxyModal: React.FC<CreateProxyModalProps> = ({ onSuccess }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const { data: response } = await createProxyUser(values);
      
      if (response.code === 0) {
        message.success('创建代理用户成功');
        setVisible(false);
        form.resetFields();
        onSuccess?.();
      } else {
        message.error(response.msg || '创建代理用户失败');
      }
    } catch (error) {
      message.error('创建代理用户失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        创建代理
      </Button>
      <Modal
        title="创建代理用户"
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="appUsername"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            label="密码"
            name="password"
            extra="如果不填写，系统将自动生成随机密码"
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          
          <Form.Item
            label="流量限制(MB)"
            name="limitFlow"
            rules={[{ required: true, message: '请输入流量限制' }]}
            initialValue={1000}
          >
            <InputNumber
              min={1}
              max={10000}
              style={{ width: '100%' }}
              placeholder="请输入流量限制"
            />
          </Form.Item>
          
          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateProxyModal; 