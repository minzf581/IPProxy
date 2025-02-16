import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, Space, message, Typography, Select } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserBalance, 
  getBusinessProducts, 
  submitDynamicOrder 
} from '@/services/businessService';
import { getAgentList } from '@/services/agentService';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo } from '@/types/agent';
import styles from './DynamicBusiness.module.css';

const { Option } = Select;
const { Text } = Typography;

const DynamicBusiness: React.FC = () => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';

  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [product, setProduct] = useState<ProductPrice | null>(null);

  // 加载余额
  const loadBalance = async () => {
    try {
      const res = await getUserBalance();
      if (res.code === 0 && res.data) {
        setBalance(res.data.balance);
      }
    } catch (error) {
      message.error('获取余额失败');
    }
  };

  // 加载代理商列表
  const loadAgents = async () => {
    if (!isAgent) return;
    try {
      const res = await getAgentList({ page: 1, pageSize: 1000, status: 'active' });
      if (res.code === 0 && res.data) {
        setAgents(res.data.list || []);
      }
    } catch (error) {
      message.error('获取用户列表失败');
    }
  };

  // 加载产品信息
  const loadProduct = async (userId?: number) => {
    try {
      const res = await getBusinessProducts({ 
        type: 'dynamic',
        userId 
      });
      if (res.code === 0 && res.data) {
        setProduct(res.data);
      }
    } catch (error) {
      message.error('获取产品信息失败');
    }
  };

  useEffect(() => {
    loadBalance();
    loadAgents();
    loadProduct();
  }, []);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    if (!product) {
      message.error('产品信息不存在');
      return;
    }

    const totalPrice = values.flow * product.price;
    if (totalPrice > balance) {
      message.error('余额不足');
      return;
    }

    try {
      setLoading(true);
      const res = await submitDynamicOrder({
        userId: values.userId || user?.id,
        flow: values.flow,
        remark: values.remark
      });

      if (res.code === 0) {
        message.success('订单提交成功');
        form.resetFields();
        loadBalance();
      } else {
        message.error(res.message || '订单提交失败');
      }
    } catch (error) {
      message.error('订单提交失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算总价
  const calculateTotal = () => {
    const flow = form.getFieldValue('flow') || 0;
    return flow * (product?.price || 0);
  };

  return (
    <PageContainer>
      <Card className={styles.balanceCard}>
        <Space>
          <Text>当前余额：</Text>
          <Text type="success" strong>{balance}</Text>
        </Space>
      </Card>

      <Card className={styles.formCard}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {isAgent && (
            <Form.Item
              name="userId"
              label="开通对象"
              rules={[{ required: true, message: '请选择开通对象' }]}
            >
              <Select
                placeholder="请选择开通对象"
                onChange={(value) => loadProduct(value)}
              >
                {agents.map(agent => (
                  <Option key={agent.id} value={agent.id}>
                    {agent.app_username || agent.username || '未命名用户'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="资源名称">
            <Input disabled value="IP池1" />
          </Form.Item>

          <Form.Item label="单价">
            <InputNumber
              disabled
              value={product?.price}
              formatter={value => `¥ ${value}`}
            />
          </Form.Item>

          <Form.Item
            name="flow"
            label="流量"
            rules={[{ required: true, message: '请输入流量' }]}
          >
            <InputNumber
              min={1}
              onChange={() => form.setFieldsValue({ total: calculateTotal() })}
            />
          </Form.Item>

          <Form.Item
            name="total"
            label="总计费用"
          >
            <InputNumber
              disabled
              formatter={value => `¥ ${value}`}
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!form.getFieldValue('flow')}
            >
              支付
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default DynamicBusiness;