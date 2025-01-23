import React from 'react';
import { Form, Input, Button, Card, message, InputNumber, Space, Divider } from 'antd';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResourceType {
  id: number;
  name: string;
  type: 'dynamic' | 'static';
  price: number;
}

interface PriceSettings {
  [key: string]: number;
}

const SettingsPage: React.FC = () => {
  const [passwordForm] = Form.useForm();
  const [priceForm] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [priceLoading, setPriceLoading] = React.useState(false);
  const [resourceTypes, setResourceTypes] = React.useState<ResourceType[]>([]);

  // 加载资源类型列表
  React.useEffect(() => {
    console.log('[Settings Debug] 开始加载资源类型列表');
    fetch('/api/settings/resource-types')
      .then(res => {
        console.log('[Settings Debug] 资源类型列表响应状态:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[Settings Debug] 资源类型列表响应数据:', data);
        if (data.code === 0) {
          setResourceTypes(data.data);
          console.log('[Settings Debug] 资源类型列表设置成功:', data.data);
        } else {
          console.error('[Settings Debug] 加载资源类型列表失败:', data.msg);
          message.error(data.msg || '加载资源类型列表失败');
        }
      })
      .catch((error) => {
        console.error('[Settings Debug] 加载资源类型列表异常:', error);
        message.error('加载资源类型列表失败');
      });
  }, []);

  // 加载价格配置
  React.useEffect(() => {
    console.log('[Settings Debug] 开始加载价格配置');
    fetch('/api/settings/price')
      .then(res => {
        console.log('[Settings Debug] 价格配置响应状态:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[Settings Debug] 价格配置响应数据:', data);
        if (data.code === 0) {
          priceForm.setFieldsValue(data.data);
          console.log('[Settings Debug] 价格配置设置成功:', data.data);
        } else {
          console.error('[Settings Debug] 加载价格配置失败:', data.msg);
          message.error(data.msg || '加载价格配置失败');
        }
      })
      .catch((error) => {
        console.error('[Settings Debug] 加载价格配置异常:', error);
        message.error('加载价格配置失败');
      });
  }, []);

  const handlePasswordSubmit = async (values: ChangePasswordForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.code === 0) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error(data.msg || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败');
    }
    setLoading(false);
  };

  const handlePriceSubmit = async (values: PriceSettings) => {
    setPriceLoading(true);
    try {
      const response = await fetch('/api/settings/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      if (data.code === 0) {
        message.success('价格配置更新成功');
      } else {
        message.error(data.msg || '价格配置更新失败');
      }
    } catch (error) {
      message.error('价格配置更新失败');
    }
    setPriceLoading(false);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        title="资源价格配置" 
        bordered={false} 
        style={{ 
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Form
          form={priceForm}
          layout="vertical"
          onFinish={handlePriceSubmit}
        >
          <Divider orientation="left">动态资源价格配置</Divider>
          <Space size={[16, 16]} wrap>
            {resourceTypes
              .filter(resource => resource.type === 'dynamic')
              .map(resource => (
                <Form.Item
                  key={resource.id}
                  name={`resource_${resource.id}`}
                  label={resource.name}
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    prefix="¥"
                    placeholder="请输入价格"
                    style={{ width: 160 }}
                  />
                </Form.Item>
              ))}
          </Space>

          <Divider orientation="left">静态资源价格配置</Divider>
          <Space size={[16, 16]} wrap>
            {resourceTypes
              .filter(resource => resource.type === 'static')
              .map(resource => (
                <Form.Item
                  key={resource.id}
                  name={`resource_${resource.id}`}
                  label={resource.name}
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    prefix="¥"
                    placeholder="请输入价格"
                    style={{ width: 160 }}
                  />
                </Form.Item>
              ))}
          </Space>

          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={priceLoading}
              htmlType="submit"
            >
              保存价格配置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card 
        title="修改管理员密码" 
        bordered={false}
        style={{ 
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
          style={{ maxWidth: 400 }}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请再次输入新密码' },
              { min: 6, message: '密码长度不能小于6位' },
              {
                validator(_, value) {
                  if (!value || passwordForm.getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<LockOutlined />}
              loading={loading}
              htmlType="submit"
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage; 