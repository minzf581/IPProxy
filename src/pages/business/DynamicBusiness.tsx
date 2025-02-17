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
  submitDynamicOrder 
} from '@/services/businessService';
import { getAgentList, getAgentUsers } from '@/services/agentService';
import { getProductPrices } from '@/services/productInventory';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo, AgentUser } from '@/types/agent';
import type { DynamicBusinessOrder } from '@/types/business';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import { useRequest } from 'ahooks';
import { UserRole } from '@/types/user';
import styles from './DynamicBusiness.module.less';

const { Option } = Select;
const { Text } = Typography;

interface SelectedAgent {
  id: number;
  name: string;
}

interface AgentListResponse {
  list: AgentInfo[];
  total: number;
}

interface DynamicBusinessOrderProduct {
  productId: string;
  quantity: number;
  duration: number;
  remark: string;
}

const DynamicBusiness: React.FC = () => {
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  // 获取代理商列表
  const { data: agentResponse } = useRequest(
    async () => {
      const response = await getAgentList({ page: 1, pageSize: 1000, status: 1 });
      return response.data;
    },
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
  const loadBalance = async (userId?: number) => {
    try {
      if (isAgent && userId) {
        // 如果是代理商，加载选中用户的余额
        const user = userList.find(u => u.id === userId);
        if (user) {
          setBalance(user.balance || 0);
        }
      } else if (!isAgent && userId) {
        // 如果是管理员，加载选中代理商的余额
        const response = await getAgentList({ page: 1, pageSize: 100, status: 1 });
        if (response.code === 0 && response.data) {
          const agent = response.data.list.find((a: AgentInfo) => Number(a.id) === userId);
          if (agent) {
            setBalance(agent.balance || 0);
          }
        }
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error('获取余额失败:', error);
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
        proxy_types: [104, 105, 201]  // 动态代理类型
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
  const handleAgentChange = async (value: number | undefined) => {
    console.log('选择用户/代理商:', value);
    setSelectedAgent(value ? { id: value, name: '' } : null);
    
    // 加载选中用户/代理商的余额
    await loadBalance(value);
    
    // 重新加载产品列表
    if (value) {
      await loadProducts(value);
    } else {
      setProducts([]);
    }
  };

  // 处理数量变更
  const handleQuantityChange = (productId: string, value: number | null) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value || 0
    }));
  };

  // 处理备注变更
  const handleRemarkChange = (productId: string, value: string) => {
    setRemarks(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // 提交订单
  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      message.error('请选择产品');
      return;
    }

    const productId = selectedProducts[0];
    const quantity = quantities[productId] || 0;
    const remark = remarks[productId] || '';

    if (quantity <= 0) {
      message.error('请输入有效的流量');
      return;
    }

    try {
      setLoading(true);
      const response = await submitDynamicOrder({
        userId: selectedAgent?.id || (user?.id ?? 0),
        flow: quantity,
        duration: 30, // 默认30天
        remark: remark
      });

      if (response.code === 0) {
        message.success('订单提交成功');
        setSelectedProducts([]);
        setQuantities({});
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

  const columns = [
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: filterOptions.types,
      onFilter: (value: any, record: ProductPrice) => record.type === value,
      render: (type: string) => (
        <span style={{ 
          color: type.includes('dynamic') ? '#1890ff' : '#52c41a',
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
      onFilter: (value: any, record: ProductPrice) => record.area === value,
      render: (area: string) => getMappedValue(AREA_MAP, area)
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 120,
      filters: filterOptions.countries,
      onFilter: (value: any, record: ProductPrice) => record.country === value,
      render: (country: string) => getMappedValue(COUNTRY_MAP, country)
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (city: string) => getMappedValue(CITY_MAP, city),
      filters: filterOptions.cities,
      onFilter: (value: any, record: ProductPrice) => record.city === value
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => `¥${price}`
    },
    {
      title: '流量(GB)',
      dataIndex: 'quantity',
      render: (_: unknown, record: ProductPrice) => (
        <InputNumber
          min={1}
          value={quantities[record.id] || 0}
          onChange={(value) => handleQuantityChange(record.id.toString(), value)}
          style={{ width: '100%' }}
          placeholder="请输入流量"
        />
      )
    },
    {
      title: '总价(元)',
      dataIndex: 'totalPrice',
      render: (_: unknown, record: ProductPrice) => {
        const quantity = quantities[record.id] || 0;
        const totalPrice = quantity * record.price;
        return <Text strong>¥{totalPrice.toFixed(2)}</Text>;
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (_: unknown, record: ProductPrice) => (
        <Input
          value={remarks[record.id] || ''}
          onChange={(e) => handleRemarkChange(record.id.toString(), e.target.value)}
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
              <li>动态代理业务包括：104、105、201类型</li>
              <li>请选择需要开通的产品并填写流量</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space direction="vertical" size="small">
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
                        {user.username}
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
            <Space direction="vertical" size="small">
              <div>账户余额</div>
              <Text style={{ fontSize: '24px', color: '#52c41a' }}>
                ¥{balance.toFixed(2)}
              </Text>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={products}
            loading={loading}
            pagination={false}
            scroll={{ y: 500 }}
            rowKey="id"
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

export default DynamicBusiness;