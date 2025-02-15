import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, message, Card, Alert, Divider, InputNumber, Tooltip } from 'antd';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getProductPrices, syncProductStock, batchUpdateProductPriceSettings, PriceUpdateItem } from '@/services/productInventory';
import { getAgentList } from '@/services/agentService';
import type { ProductPrice } from '@/types/product';
import type { ColumnsType } from 'antd/es/table';
import type { AgentInfo, Agent } from '@/types/agent';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import PriceSettingsModal from '@/components/PriceSettings/PriceSettingsModal';
import PriceImportExport from '@/components/PriceSettings/PriceImportExport';
import { useRequest } from 'ahooks';
import './index.less';

const { Option } = Select;

interface PriceUpdate {
  product_id: number;
  type: string;
  proxy_type: number;
  price: number;
  min_agent_price: number;
  is_global: boolean;
}

const DynamicProductPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
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
  const [modifiedPrices, setModifiedPrices] = useState<Record<string, { price: number; minAgentPrice: number }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 获取代理商列表
  const { data: agentResponse } = useRequest(
    async () => getAgentList({ page: 1, pageSize: 1000, status: 'active' }),
    { cacheKey: 'agentList' }
  );
  const agents = agentResponse?.list || [];

  // 加载价格数据
  const loadPrices = async () => {
    try {
      setLoading(true);
      const response = await getProductPrices({ 
        is_global: isGlobal,
        agent_id: selectedAgent?.id,
        proxy_types: [104, 105, 201]
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
      console.error('加载价格失败:', error);
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
  const handlePriceChange = (id: string, value: number, field: 'price' | 'minAgentPrice') => {
    const newPrices = { ...modifiedPrices };
    if (field === 'price') {
      newPrices[id] = { ...newPrices[id], price: value };
    } else {
      newPrices[id] = { ...newPrices[id], minAgentPrice: value };
    }
    setModifiedPrices(newPrices);
    setHasChanges(true);
  };

  // 应用价格变更
  const handleApplyChanges = async () => {
    try {
      const updates = Object.entries(modifiedPrices).map(([id, values]) => {
        const productId = Number(id);
        const product = prices.find(p => p.id === productId);
        return {
          product_id: productId,
          type: product?.type || '',
          proxy_type: product?.proxyType || 0,
          price: values.price,
          min_agent_price: values.minAgentPrice,
          is_global: !selectedAgent
        };
      });

      const requestData = {
        prices: updates,
        agent_id: selectedAgent ? selectedAgent.id : undefined
      };

      console.log('发送价格更新请求:', requestData);
      await batchUpdateProductPriceSettings(requestData);
      message.success('价格更新成功');
      setModifiedPrices({});
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
      const agent = agents.find(a => a.id === value);
      if (agent) {
        setSelectedAgent({
          id: agent.id,
          name: agent.app_username || agent.username || '未命名代理商'
        });
        setIsGlobal(false);
      }
    }
    
    // 清除修改状态
    setModifiedPrices({});
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
      title: (
        <Space>
          价格
          <Tooltip title="此处设置的价格为系统全局默认价格">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number, record: ProductPrice) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          precision={1}
          value={modifiedPrices[record.id]?.price ?? price}
          onChange={(value) => handlePriceChange(record.id, value || 0, 'price')}
          prefix="¥"
        />
      )
    },
    {
      title: (
        <Space>
          最低价
          <Tooltip title="代理商价格不能低于此价格">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'minAgentPrice',
      key: 'minAgentPrice',
      width: 120,
      render: (minPrice: number, record: ProductPrice) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          precision={1}
          value={modifiedPrices[record.id]?.minAgentPrice ?? minPrice}
          onChange={(value) => handlePriceChange(record.id, value || 0, 'minAgentPrice')}
          prefix="¥"
          disabled={!isGlobal}
        />
      )
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ].filter(col => col.key !== 'action'); // 移除操作列

  return (
    <div className="dynamic-product-page">
      <Card title="动态代理产品管理" bordered={false}>
        <Alert
          message="价格说明"
          description={
            <ul>
              <li>动态代理产品包括：104、105、201类型</li>
              <li>可以设置代理商价格、最低代理价格和全局价格</li>
              <li>修改价格后将立即生效</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>设置对象</div>
            <Space direction="vertical" size="small">
              <Select
                placeholder="选择代理商"
                allowClear
                style={{ width: 300 }}
                value={selectedAgent?.id}
                onChange={handleAgentChange}
              >
                {agents.map(agent => (
                  <Option key={agent.id} value={agent.id}>
                    {agent.app_username || agent.username || '未命名代理商'}
                  </Option>
                ))}
              </Select>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {selectedAgent ? '当前显示所选代理商的价格' : '当前显示默认全局价格'}
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

export default DynamicProductPage; 