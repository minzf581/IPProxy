import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, message, Card, Alert, Divider, InputNumber, Tooltip, Modal } from 'antd';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getProductPrices, syncProductStock } from '@/services/productInventory';
import { getAgentList } from '@/services/agentService';
import { batchUpdateProductPriceSettings } from '@/services/settingsService';
import type { ProductPrice } from '@/types/product';
import type { ColumnsType } from 'antd/es/table';
import type { AgentInfo } from '@/types/agent';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import PriceSettingsModal from '@/components/PriceSettings/PriceSettingsModal';
import PriceImportExport from '@/components/PriceSettings/PriceImportExport';
import { useRequest } from 'ahooks';
import './index.less';

const { Option } = Select;

const StaticProductPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
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
      console.log('加载静态代理价格数据...');
      const response = await getProductPrices({ 
        is_global: true,  // 添加必需的 is_global 参数
        agent_id: selectedAgent || undefined,
        proxy_types: [101, 102, 103]  // 静态代理类型
      });
      
      if (response.code === 0 || response.code === 200) {
        console.log('API返回的数据:', response.data);
        console.log('数据结构示例:', JSON.stringify(response.data[0], null, 2));
        
        // 过滤静态代理类型的数据
        const filteredData = response.data.filter(item => {
          return [101, 102, 103].includes(item.proxyType); // 静态代理类型
        });
        
        console.log('过滤后的静态代理数据长度:', filteredData.length);
        
        // 处理数据，设置默认最低价
        const formattedData = filteredData.map((item, index) => ({
          ...item,
          key: index,
          minAgentPrice: item.minAgentPrice || (item.price * 0.8)
        }));
        
        setPrices(formattedData);
        message.success('加载产品数据成功');
      } else {
        message.error(response.message || '加载产品数据失败');
      }
    } catch (error) {
      console.error('加载产品数据失败:', error);
      message.error('加载产品数据失败');
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
    const currentItem = prices.find(p => p.id === id);
    if (!currentItem) return;

    setModifiedPrices(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // 应用价格变更
  const handleApplyChanges = async () => {
    try {
      // 验证最低价不能高于价格
      const invalidPrices = Object.entries(modifiedPrices).filter(([id, priceData]) => {
        const item = prices.find(p => p.id === id);
        if (!item) return false;
        const finalPrice = priceData.price ?? item.price;
        const finalMinPrice = priceData.minAgentPrice ?? item.minAgentPrice;
        return finalMinPrice > finalPrice;
      });

      if (invalidPrices.length > 0) {
        const invalidItems = invalidPrices.map(([id]) => {
          const item = prices.find(p => p.id === id);
          return item ? item.type : id;
        });
        message.error(`以下产品的最低代理商价格高于全局价格，请重新设置：${invalidItems.join(', ')}`);
        return;
      }

      setLoading(true);
      const updates = Object.entries(modifiedPrices).map(([id, priceData]) => {
        const item = prices.find(p => p.id === id);
        if (!item) return null;
        return {
          productId: id,
          type: item.type,
          proxyType: item.proxyType,
          globalPrice: priceData.price ?? item.price,
          minAgentPrice: priceData.minAgentPrice ?? item.minAgentPrice,
          isGlobal: true
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      if (updates.length === 0) {
        message.error('没有需要更新的数据');
        return;
      }

      const response = await batchUpdateProductPriceSettings(updates);
      if (response.code === 0 || response.code === 200) {
        message.success('价格更新成功');
        setModifiedPrices({});
        setHasChanges(false);
        loadPrices();
      } else {
        message.error(response.message || '价格更新失败');
      }
    } catch (error) {
      console.error('更新价格失败:', error);
      message.error('更新价格失败');
    } finally {
      setLoading(false);
    }
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
      title: 'IP范围',
      dataIndex: 'ipRange',
      key: 'ipRange',
      width: 160,
      ellipsis: {
        showTitle: false,
      },
      render: (ipRange: string) => (
        ipRange ? (
          <Tooltip placement="topLeft" title={ipRange}>
            {ipRange}
          </Tooltip>
        ) : '-'
      ),
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
      title: '最低价',
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
          disabled={!!selectedAgent}
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
    <div className="static-product-page">
      <Card title="静态代理产品管理" bordered={false}>
        <Alert
          message="价格说明"
          description={
            <ul>
              <li>静态代理产品包括：101、102、103类型</li>
              <li>可以设置代理商价格、最低代理价格和全局价格</li>
              <li>修改价格后将立即生效</li>
              <li>IP范围为静态代理特有属性</li>
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
              <Select<number | null>
                placeholder="选择代理商（默认为全局价格）"
                allowClear
                style={{ width: 300 }}
                value={selectedAgent}
                onChange={(value) => {
                  setSelectedAgent(value);
                }}
              >
                {agents.map((agent: AgentInfo) => (
                  <Option key={agent.id} value={agent.id}>
                    {(agent as any).username || agent.app_username || '未命名代理商'}
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

export default StaticProductPage; 