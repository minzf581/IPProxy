import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Space, message, Typography, Select, Input, Checkbox, InputNumber } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserBalance, 
  getBusinessProducts, 
  submitStaticOrder 
} from '@/services/businessService';
import { getAgentList } from '@/services/agentService';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo } from '@/types/agent';
import { PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP } from '@/constants/mappings';
import styles from './StaticBusiness.module.css';

const { Option } = Select;
const { Text } = Typography;

interface TableRecord extends Omit<ProductPrice, 'id' | 'key'> {
  id: string;
  key: string;
}

const StaticBusiness: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';

  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [products, setProducts] = useState<TableRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  // 计算总价
  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((total, productId) => {
      const product = products.find(p => p.id === productId);
      if (!product) return total;
      return total + (
        product.price * 
        (quantities[productId] || 0) * 
        (durations[productId] || 1)
      );
    }, 0);
  }, [selectedProducts, quantities, durations, products]);

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

  // 加载产品列表
  const loadProducts = async (userId?: number) => {
    try {
      const res = await getBusinessProducts({ 
        type: 'static',
        userId 
      });
      if (res.code === 0 && res.data) {
        const formattedProducts = (res.data as ProductPrice[]).map(product => ({
          ...product,
          id: product.id.toString(),
          key: product.id.toString()
        }));
        setProducts(formattedProducts);
      }
    } catch (error) {
      message.error('获取产品列表失败');
    }
  };

  useEffect(() => {
    loadBalance();
    loadAgents();
    loadProducts();
  }, []);

  // 处理产品选择
  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // 处理数量变更
  const handleQuantityChange = (productId: string, value: number | null) => {
    setQuantities({
      ...quantities,
      [productId]: value || 0
    });
  };

  // 处理时长变更
  const handleDurationChange = (productId: string, value: number) => {
    setDurations({
      ...durations,
      [productId]: value
    });
  };

  // 处理备注变更
  const handleRemarkChange = (productId: string, value: string) => {
    setRemarks({
      ...remarks,
      [productId]: value
    });
  };

  // 处理提交
  const handleSubmit = async () => {
    if (totalPrice > balance) {
      message.error('余额不足');
      return;
    }

    const orderProducts = selectedProducts
      .filter(productId => quantities[productId] && quantities[productId] > 0)
      .map(productId => ({
        productId,
        quantity: quantities[productId],
        duration: durations[productId] || 1,
        remark: remarks[productId]
      }));

    if (orderProducts.length === 0) {
      message.error('请选择要购买的产品');
      return;
    }

    try {
      setLoading(true);
      const res = await submitStaticOrder({
        userId: selectedUserId || user?.id || 0,
        products: orderProducts
      });

      if (res.code === 0) {
        message.success('订单提交成功');
        setSelectedProducts([]);
        setQuantities({});
        setDurations({});
        setRemarks({});
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

  // 表格列配置
  const columns = [
    {
      title: '选择',
      dataIndex: 'id',
      width: 60,
      render: (id: string) => (
        <Checkbox
          checked={selectedProducts.includes(id)}
          onChange={e => handleProductSelect(id, e.target.checked)}
        />
      )
    },
    {
      title: '资源名称',
      dataIndex: 'type',
      render: (type: string) => PRODUCT_NO_MAP[type] || type
    },
    {
      title: '区域',
      dataIndex: 'area',
      render: (area: string) => AREA_MAP[area] || area
    },
    {
      title: '国家',
      dataIndex: 'country',
      render: (country: string) => COUNTRY_MAP[country] || country
    },
    {
      title: '城市',
      dataIndex: 'city'
    },
    {
      title: 'IP段',
      dataIndex: 'ipRange'
    },
    {
      title: '单价',
      dataIndex: 'price',
      render: (price: number) => `¥ ${price}`
    },
    {
      title: '代理时长',
      width: 120,
      render: (_: unknown, record: TableRecord) => (
        <Select
          value={durations[record.id] || 1}
          onChange={v => handleDurationChange(record.id, v)}
          disabled={!selectedProducts.includes(record.id)}
        >
          <Option value={1}>1个月</Option>
          <Option value={3}>3个月</Option>
          <Option value={6}>6个月</Option>
          <Option value={12}>12个月</Option>
        </Select>
      )
    },
    {
      title: '代理数量',
      width: 120,
      render: (_: unknown, record: TableRecord) => (
        <InputNumber
          min={1}
          value={quantities[record.id] || 0}
          onChange={v => handleQuantityChange(record.id, v)}
          disabled={!selectedProducts.includes(record.id)}
        />
      )
    },
    {
      title: '总计费用',
      width: 120,
      render: (_: unknown, record: TableRecord) => {
        const quantity = quantities[record.id] || 0;
        const duration = durations[record.id] || 1;
        return `¥ ${record.price * quantity * duration}`;
      }
    },
    {
      title: '备注',
      width: 200,
      render: (_: unknown, record: TableRecord) => (
        <Input.TextArea
          value={remarks[record.id] || ''}
          onChange={e => handleRemarkChange(record.id, e.target.value)}
          disabled={!selectedProducts.includes(record.id)}
          rows={2}
        />
      )
    }
  ];

  return (
    <PageContainer>
      <Card className={styles.headerCard}>
        <Space size="large">
          <Space>
            <Text>当前余额：</Text>
            <Text type="success" strong>{balance}</Text>
          </Space>
          <Space>
            <Text>总计费用：</Text>
            <Text type="warning" strong>{totalPrice}</Text>
          </Space>
          {isAgent && (
            <Select
              placeholder="请选择开通对象"
              style={{ width: 200 }}
              onChange={(value) => {
                setSelectedUserId(value);
                loadProducts(value);
              }}
            >
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {agent.app_username || agent.username || '未命名用户'}
                </Option>
              ))}
            </Select>
          )}
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={selectedProducts.length === 0 || !Object.values(quantities).some(q => q > 0)}
          >
            支付
          </Button>
        </Space>
      </Card>

      <Card className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={false}
        />
      </Card>
    </PageContainer>
  );
};

export default StaticBusiness; 