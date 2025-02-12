import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Descriptions, Row, Col } from 'antd';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';
import { updatePassword } from '@/services/auth';
import PriceConfigModal from '@/components/Agent/PriceConfigModal';
import { getProductPrices } from '@/services/productInventory';
import type { ApiResponse } from '@/types/api';
import type { User, UserRole } from '@/types/user';
import type { ProductPrice } from '@/types/product';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsPage: React.FC = () => {
  const [passwordForm] = Form.useForm<ChangePasswordForm>();
  const [loading, setLoading] = React.useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const { user } = useAuth();

  // 加载产品价格
  useEffect(() => {
    if (user?.is_admin) {
      const loadPrices = async () => {
        try {
          const data = await getProductPrices({ isGlobal: true });
          setProductPrices(data);
        } catch (error) {
          console.error('加载价格设置失败:', error);
          message.error('加载价格设置失败');
        }
      };
      loadPrices();
    }
  }, [user]);

  const handlePasswordSubmit = async (values: ChangePasswordForm) => {
    if (!user) {
      message.error('用户未登录');
      return;
    }

    setLoading(true);
    try {
      const success = await updatePassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      if (success) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error('密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('密码修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.is_admin;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        {/* 账号信息和修改密码 */}
        <Col span={12}>
          <Card 
            title="账号信息" 
            bordered={false}
            style={{ 
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              marginBottom: 24
            }}
          >
            <Descriptions column={1}>
              <Descriptions.Item label="用户名">{user.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="账号类型">{isAdmin ? '管理员' : '代理商'}</Descriptions.Item>
              <Descriptions.Item label="账号状态">{user.status === 'active' ? '正常' : '禁用'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {user.created_at ? dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新时间">
                {user.updated_at ? dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title="修改密码" 
            bordered={false}
            style={{ 
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              marginBottom: 24
            }}
          >
            <Form<ChangePasswordForm>
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
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
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请再次输入新密码' },
                  { min: 6, message: '密码长度不能小于6位' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
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
                  icon={<SaveOutlined />}
                  loading={loading}
                  htmlType="submit"
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 全局价格设置（仅管理员可见） */}
      {isAdmin && (
        <Card 
          title="全局价格设置" 
          bordered={false}
          style={{ 
            borderRadius: 8,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
          extra={
            <Button 
              type="primary" 
              onClick={() => setPriceModalVisible(true)}
            >
              设置价格
            </Button>
          }
        >
          <p>在此设置系统全局默认价格，此价格将作为所有代理商的默认价格。</p>
        </Card>
      )}

      {/* 价格设置弹窗 */}
      <PriceConfigModal
        visible={priceModalVisible}
        isGlobal={true}
        initialPrices={productPrices}
        onClose={() => setPriceModalVisible(false)}
      />
    </div>
  );
}

export default SettingsPage; 