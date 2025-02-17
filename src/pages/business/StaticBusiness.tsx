import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Typography, Select, Input, InputNumber, Alert } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Key } from 'react';
import type { ColumnType } from 'antd/es/table';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserBalance, 
  getBusinessProducts, 
  submitStaticOrder 
} from '@/services/businessService';
import { getAgentList, getAgentUsers } from '@/services/agentService';
import { getProductPrices } from '@/services/productInventory';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo, AgentUser } from '@/types/agent';
import type { StaticBusinessOrder } from '@/types/business';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import { useRequest } from 'ahooks';
import { UserRole } from '@/types/user';
import styles from './StaticBusiness.module.less';

const { Option } = Select;
const { Text } = Typography;

interface SelectedAgent {
  id: number;
  name: string;
}

interface StaticBusinessOrderProduct {
  productId: string;
  quantity: number;
  duration: number;
  remark: string;
}

const StaticBusiness: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === UserRole.AGENT;
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    types: { text: string; value: string }[];
    areas: { text: string; value: string }[];
    countries: { text: string; value: string }[];
    cities: { text: string; value: string }[];
  }>({
    types: [],
    areas: [],
    countries: [],
    cities: [],
  });
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  // 获取代理商列表
  const { data: agentResponse } = useRequest(
    async () => getAgentList({ page: 1, pageSize: 1000, status: 1 }),
    { 
      cacheKey: 'agentList',
      ready: !isAgent
    }
  );
  const agents = agentResponse?.list || [];

  // 获取代理商的用户列表
  const { data: userResponse } = useRequest(
    async () => {
      if (isAgent && user?.id) {
        const response = await getAgentUsers({
          agentId: user.id,
          page: 1,
          pageSize: 1000,
          status: 'active'
        });
        return response;
      }
      return { list: [], total: 0 };
    },
    {
      cacheKey: 'agentUserList',
      ready: !!isAgent && !!user?.id
    }
  );
  const userList = (userResponse?.list || []) as AgentUser[];

  // 加载余额
  const loadBalance = async () => {
    try {
      const response = await getAgentList({ page: 1, pageSize: 100, status: 1 });
      if (response.list && response.list.length > 0) {
        const agent = response.list[0];
        setBalance(agent.balance);
      }
    } catch (error) {
      message.error('获取余额失败');
    }
  };

  // 加载产品列表
  const loadProducts = async (userId?: number) => {
    try {
      setLoading(true);
      const params: {
        is_global: boolean;
        proxy_types: number[];
        user_id?: number;
        agent_id?: number;
      } = {
        is_global: false,
        proxy_types: [101, 102, 103]  // 静态代理类型
      };

      // 如果选择了代理商或用户
      if (selectedAgent) {
        if (isAgent) {
          // 如果当前是代理商角色，传递用户ID
          params.user_id = selectedAgent.id;
        } else {
          // 如果当前是管理员角色，传递代理商ID
          params.agent_id = selectedAgent.id;
        }
      }
      
      const response = await getProductPrices(params);
      
      if (response.code === 0 && response.data) {
        const productData = Array.isArray(response.data) ? response.data : [response.data];
        setProducts(productData);
        
        // 更新筛选选项
        if (productData.length > 0) {
          const types = getUniqueValues(productData, 'type').map(type => ({
            text: getMappedValue(PRODUCT_NO_MAP, type),
            value: type
          }));
          
          const areas = getUniqueValues(productData, 'area').map(area => ({
            text: getMappedValue(AREA_MAP, area),
            value: area
          }));
          
          const countries = getUniqueValues(productData, 'country').map(country => ({
            text: getMappedValue(COUNTRY_MAP, country),
            value: country
          }));
          
          const cities = getUniqueValues(productData, 'city').map(city => ({
            text: city,
            value: city
          }));

          setFilterOptions({ types, areas, countries, cities });
        }
      }
    } catch (error) {
      message.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
    loadProducts();
  }, []);

  // 处理代理商/用户选择
  const handleAgentChange = (value: number | null) => {
    if (value === null) {
      setSelectedAgent(null);
      loadProducts();
      return;
    }

    if (isAgent) {
      const selectedUser = userList.find(u => u.id === value);
      if (selectedUser) {
        setSelectedAgent({
          id: value,
          name: selectedUser.account || '未命名用户'
        });
      }
    } else {
      const agent = agents.find(a => String(a.id) === String(value));
      if (agent) {
        setSelectedAgent({
          id: value,
          name: agent.username || '未命名代理商'
        });
      }
    }
    
    // 清除选择状态
    setSelectedProducts([]);
    setQuantities({});
    setDurations({});
    setRemarks({});
    
    // 重新加载产品
    loadProducts(value);
  };

  // 处理数量变更
  const handleQuantityChange = (productId: number, value: number | null) => {
    if (value === null) return;
    setQuantities({
      ...quantities,
      [productId]: value
    });
  };

  // 处理时长变更
  const handleDurationChange = (productId: number, value: number) => {
    setDurations({
      ...durations,
      [productId]: value
    });
  };

  // 处理备注变更
  const handleRemarkChange = (productId: number, value: string) => {
    setRemarks({
      ...remarks,
      [productId]: value
    });
  };

  // 提交订单
  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      message.error('请选择至少一个产品');
      return;
    }

    const orderProducts: StaticBusinessOrderProduct[] = selectedProducts
      .map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        
        return {
          productId: String(productId),
          quantity: quantities[productId] || 0,
          duration: durations[productId] || 1,
          remark: remarks[productId] || ''
        };
      })
      .filter((product): product is StaticBusinessOrderProduct => product !== null);

    if (orderProducts.length === 0) {
      message.error('订单数据无效');
      return;
    }

    try {
      setLoading(true);
      const response = await submitStaticOrder({
        userId: selectedAgent?.id || user?.id || 0,
        products: orderProducts
      });

      if (response.code === 0) {
        message.success('订单提交成功');
        setSelectedProducts([]);
        setQuantities({});
        setDurations({});
        setRemarks({});
        loadBalance();
        loadProducts();
      } else {
        message.error(response.message || '订单提交失败');
      }
    } catch (error) {
      message.error('订单提交失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnType<ProductPrice>[] = [
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: filterOptions.types,
      onFilter: (value: boolean | Key, record: ProductPrice) => record.type === value.toString(),
      render: (type: string) => (
        <span style={{ 
          color: type.includes('static') ? '#52c41a' : '#1890ff',
          fontWeight: 500
        }}>
          {getMappedValue(PRODUCT_NO_MAP, type)}
        </span>
      )
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      filters: filterOptions.areas,
      onFilter: (value: boolean | Key, record: ProductPrice) => record.area === value.toString(),
      render: (area: string) => getMappedValue(AREA_MAP, area)
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 120,
      filters: filterOptions.countries,
      onFilter: (value: boolean | Key, record: ProductPrice) => record.country === value.toString(),
      render: (country: string) => getMappedValue(COUNTRY_MAP, country)
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (city: string) => city,
      filters: filterOptions.cities,
      onFilter: (value: boolean | Key, record: ProductPrice) => record.city === value.toString()
    },
    {
      title: 'IP段',
      dataIndex: 'ipRange',
      key: 'ipRange',
      width: 200
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => `¥${price}`
    },
    {
      title: '时长',
      key: 'duration',
      width: 120,
      render: (_: any, record: ProductPrice) => (
        <Select
          value={durations[record.id] || 1}
          onChange={(value) => handleDurationChange(record.id, value)}
          style={{ width: '100%' }}
        >
          <Option value={1}>1个月</Option>
          <Option value={3}>3个月</Option>
          <Option value={6}>6个月</Option>
          <Option value={12}>12个月</Option>
        </Select>
      )
    },
    {
      title: '数量',
      key: 'quantity',
      width: 120,
      render: (_: any, record: ProductPrice) => (
        <InputNumber
          min={1}
          value={quantities[record.id] || 0}
          onChange={(value) => handleQuantityChange(record.id, value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '备注',
      key: 'remark',
      width: 200,
      render: (_: any, record: ProductPrice) => (
        <Input
          value={remarks[record.id] || ''}
          onChange={(e) => handleRemarkChange(record.id, e.target.value)}
          placeholder="请输入备注"
        />
      )
    }
  ];

  return (
    <PageContainer>
      <Card className="dynamic-business-page">
        <Alert
          message="业务说明"
          description={
            <ul>
              <li>静态代理业务包括：101、102、103类型</li>
              <li>当前余额：¥{balance}</li>
              <li>请选择需要开通的产品并填写数量和时长</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>{isAgent ? '选择用户' : '开通对象'}</div>
            <Select
              placeholder={isAgent ? "选择用户" : "选择代理商"}
              allowClear
              style={{ width: 200 }}
              onChange={handleAgentChange}
            >
              {isAgent
                ? userList.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.account}
                    </Option>
                  ))
                : agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.username}
                    </Option>
                  ))
              }
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={products}
            loading={loading}
            pagination={false}
            scroll={{ y: 500 }}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedProducts,
              onChange: (selectedRowKeys) => {
                setSelectedProducts(selectedRowKeys as number[]);
              }
            }}
          />

          <Space>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={selectedProducts.length === 0}
            >
              提交订单
            </Button>
          </Space>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default StaticBusiness; 