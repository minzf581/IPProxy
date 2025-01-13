import React from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { getSystemSettings, updateSettings } from '@/services/settingService';

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getSystemSettings();
      form.setFieldsValue(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      message.error('加载系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await updateSettings(values);
      message.success('系统设置更新成功');
    } catch (error) {
      console.error('Failed to update settings:', error);
      message.error('更新系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="系统设置" loading={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name={['system', 'name']}
          label="系统名称"
          rules={[{ required: true, message: '请输入系统名称' }]}
        >
          <Input placeholder="请输入系统名称" />
        </Form.Item>

        <Form.Item
          name={['system', 'logo']}
          label="系统Logo"
          rules={[{ required: true, message: '请输入Logo URL' }]}
        >
          <Input placeholder="请输入Logo URL" />
        </Form.Item>

        <Form.Item
          name={['system', 'description']}
          label="系统描述"
        >
          <Input.TextArea rows={4} placeholder="请输入系统描述" />
        </Form.Item>

        <Form.Item
          name={['email', 'service']}
          label="客服邮箱"
          rules={[
            { required: true, message: '请输入客服邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入客服邮箱" />
        </Form.Item>

        <Form.Item
          name={['notification', 'announcement']}
          label="系统公告"
        >
          <Input.TextArea rows={4} placeholder="请输入系统公告" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SettingsPage;