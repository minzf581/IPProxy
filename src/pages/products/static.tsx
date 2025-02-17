import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, message, Card, Alert, Divider, InputNumber, Tooltip } from 'antd';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getProductPrices, syncProductStock, batchUpdateProductPriceSettings, type PriceUpdateItem } from '@/services/productInventory';
import { getAgentList, getAgentUsers } from '@/services/agentService';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo, AgentUser } from '@/types/agent';
import type { ColumnsType } from 'antd/es/table';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import PriceSettingsModal from '@/components/PriceSettings/PriceSettingsModal';
import PriceImportExport from '@/components/PriceSettings/PriceImportExport';
import { useRequest } from 'ahooks';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';
import './index.less';

const { Option } = Select;

interface SelectedAgent {
  id: number;
  name: string;
}

interface ModifiedPrice {
  product_id: number;
  price: number;
  minAgentPrice?: number;
}

const StaticProductPage: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === UserRole.AGENT;
  const [loading, setLoading] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
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
  const [modifiedPrices, setModifiedPrices] = useState<ModifiedPrice[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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

  // 加载价格数据
  const loadPrices = async () => {
    try {
      setLoading(true);
      const response = await getProductPrices({ 
        is_global: isGlobal,
        agent_id: selectedAgent?.id,
        proxy_types: [101, 102, 103]  // 静态代理类型
      });
      
      if ((response.code === 200 || response.code === 0) && response.data) {
        const priceData = response.data.map(item => ({
          ...item,
          key: Number(item.id),
          minAgentPrice: Number(item.minAgentPrice || 0),
        }));
        setPrices(priceData);
      }
    } catch (error) {
      message.error('加载价格数据失败');
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 同步库存
  const handleSyncStock = async () => {
    try {
      const response = await syncProductStock();
      if (response.code === 0) {
        message.success('库存同步成功');
        loadPrices();
      } else {
        message.error(response.message || '库存同步失败');
      }
    } catch (error) {
      console.error('库存同步失败:', error);
      message.error('库存同步失败');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadPrices();
    } else {
      message.error('请先登录');
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (prices.length > 0) {
      const types = getUniqueValues(prices, 'type').map(type => ({
        text: getMappedValue(PRODUCT_NO_MAP, type),
        value: type
      }));
      
      const areas = getUniqueValues(prices, 'area').map(area => ({
        text: getMappedValue(AREA_MAP, area),
        value: area
      }));
      
      const countries = getUniqueValues(prices, 'country').map(country => ({
        text: getMappedValue(COUNTRY_MAP, country),
        value: country
      }));
      
      const cities = getUniqueValues(prices, 'city').map(city => ({
        text: city,
        value: city
      }));

      setFilterOptions({ types, areas, countries, cities });
    }
  }, [prices]);

  const handleEdit = (record: ProductPrice) => {
    setSelectedPrice(record);
    setVisible(true);
  };

  // 处理价格变更
  const handlePriceChange = (id: number, value: number | null, field: 'price' | 'minAgentPrice' = 'price') => {
    const numericValue = value === null ? 0 : value;
    if (isNaN(numericValue)) {
      return;
    }

    const productId = id;
    const newPrices = [...prices];
    const index = newPrices.findIndex((item) => item.id === productId);
    if (index !== -1) {
      newPrices[index] = { ...newPrices[index], [field]: numericValue };
      setPrices(newPrices);

      setModifiedPrices((prev) => {
        const existingIndex = prev.findIndex((item) => item.product_id === productId);
        if (existingIndex !== -1) {
          const newModifiedPrices = [...prev];
          newModifiedPrices[existingIndex] = {
            ...newModifiedPrices[existingIndex],
            [field]: numericValue,
          };
          setHasChanges(true);
          return newModifiedPrices;
        }
        setHasChanges(true);
        return [...prev, { product_id: productId, price: 0, [field]: numericValue }];
      });
    }
  };

  // 应用价格变更
  const handleApplyChanges = async () => {
    try {
      const validUpdates = modifiedPrices
        .map((item) => {
          const product = prices.find(p => p.id === item.product_id);
          if (!product) {
            console.warn(`未找到产品信息: ${item.product_id}`);
            return null;
          }
          
          return {
            product_id: item.product_id,
            type: product.type,
            proxy_type: product.proxyType,
            price: item.price,
            min_agent_price: item.minAgentPrice || 0,
            is_global: !selectedAgent,
            agent_id: selectedAgent?.id
          };
        })
        .filter(Boolean) as PriceUpdateItem[];

      const requestData = {
        prices: validUpdates,
        agent_id: selectedAgent?.id
      };

      await batchUpdateProductPriceSettings(requestData);
      message.success('价格更新成功');
      setModifiedPrices([]);
      setHasChanges(false);
      loadPrices();
    } catch (error) {
      console.error('更新价格失败:', error);
      message.error('更新价格失败');
    }
  };

  const handleAgentChange = (value: number | null) => {
    setLoading(true);
    if (value === null) {
      setSelectedAgent(null);
      setIsGlobal(true);
    } else {
      if (isAgent) {
        // 代理商模式下，value 是用户ID
        const selectedUser = userList.find(u => u.id === value);
        if (selectedUser) {
          setSelectedAgent({
            id: value,
            name: selectedUser.account || '未命名用户'
          });
          setIsGlobal(false);
        }
      } else {
        // 管理员模式下，value 是代理商ID
        const agent = agents.find(a => Number(a.id) === value);
        if (agent) {
          setSelectedAgent({
            id: value,
            name: agent.app_username || agent.username || '未命名代理商'
          });
          setIsGlobal(false);
        }
      }
    }
    
    // 清除修改状态
    setModifiedPrices([]);
    setHasChanges(false);
    
    // 重新加载价格
    loadPrices();
  };

  const columns: ColumnsType<ProductPrice> = [
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
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number, record: ProductPrice) => (
        <InputNumber
          min={0}
          step={0.1}
          value={price}
          onChange={(value: number | null) => handlePriceChange(record.id, value)}
          style={{ width: '100%' }}
        />
      )
    },
    ...(!isAgent ? [{
      title: '最低代理价格',
      dataIndex: 'minAgentPrice',
      key: 'minAgentPrice',
      width: 120,
      render: (price: number, record: ProductPrice) => (
        <InputNumber
          min={0}
          step={0.1}
          value={price}
          onChange={(value: number | null) => handlePriceChange(record.id, value, 'minAgentPrice')}
          style={{ width: '100%' }}
        />
      )
    }] : [])
  ];

  return (
    <div className="static-product-page">
      <Card title="静态代理产品管理" bordered={false}>
        <Alert
          message="价格说明"
          description={
            <ul>
              <li>静态代理产品包括：101、102、103类型</li>
              {isAgent ? (
                <li>可以为用户设置特定价格</li>
              ) : (
                <li>可以设置代理商价格、最低代理价格和全局价格</li>
              )}
              <li>修改价格后将立即生效</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>{isAgent ? '选择用户' : '设置对象'}</div>
            <Space direction="vertical" size="small">
              <Select
                placeholder={isAgent ? "选择要设置价格的用户" : "选择代理商"}
                allowClear
                style={{ width: 300 }}
                value={selectedAgent?.id}
                onChange={handleAgentChange}
              >
                {isAgent ? (
                  userList.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.account || '未命名用户'}
                    </Option>
                  ))
                ) : (
                  agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.app_username || agent.username || '未命名代理商'}
                    </Option>
                  ))
                )}
              </Select>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {isAgent ? (
                  selectedAgent ? '当前显示所选用户的价格' : '当前显示您的默认价格'
                ) : (
                  selectedAgent ? '当前显示所选代理商的价格' : '当前显示默认全局价格'
                )}
              </div>
            </Space>
          </Space>

          <Space>
            <PriceImportExport 
              onImportSuccess={loadPrices}
              currentData={prices}
            />
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleSyncStock}
            >
              同步库存
            </Button>
            <Button
              type="primary"
              disabled={!hasChanges}
              onClick={handleApplyChanges}
              style={{ marginLeft: 'auto' }}
            >
              应用价格设置
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={prices}
            loading={loading}
            pagination={false}
            scroll={{ y: 500 }}
          />
        </Space>
      </Card>

      <PriceSettingsModal
        visible={visible}
        initialData={selectedPrice}
        minAgentPrice={0}
        onSuccess={() => {
          setVisible(false);
          setSelectedPrice(null);
          loadPrices();
          message.success('价格更新成功');
        }}
        onCancel={() => {
          setVisible(false);
          setSelectedPrice(null);
        }}
      />
    </div>
  );
};

export default StaticProductPage; 