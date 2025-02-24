import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Select, Alert, message, InputNumber, Tooltip } from 'antd';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { getProductPrices, syncProductStock, batchUpdateProductPriceSettings, getProductStock, type PriceUpdateItem } from '@/services/productInventory';
import { getAgentList } from '@/services/agentService';
import { searchUsers } from '@/services/userService';
import { ProductPrice, ProductStock } from '@/types/product';
import { UserRole } from '@/types/user';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP } from '@/constants/mappings';
import PriceImportExport from '@/components/PriceSettings/PriceImportExport';
import PriceSettingsModal from '@/components/PriceSettings/PriceSettingsModal';
import IpWhitelistInput from '@/components/IpWhitelistInput';
import './index.less';
import type { ColumnsType } from 'antd/es/table';
import { debug } from '@/utils/debug';
import type { AgentInfo } from '@/types/agent';
import { useRequest } from 'ahooks';

const { Option } = Select;

interface ModifiedPrice {
  price: number;
  minAgentPrice: number;
  ipWhitelist?: string[];
}

interface ModifiedPrices {
  [key: string]: ModifiedPrice;
}

interface FilterOption {
  text: string;
  value: string;
}

interface FilterOptions {
  types: FilterOption[];
}

interface IpChange {
  productId: number;
  ip: string;
}

const DynamicProductPage: React.FC = () => {
  const { user, isAgent } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ types: [] });
  const [modifiedPrices, setModifiedPrices] = useState<ModifiedPrices>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [priceChanges, setPriceChanges] = useState<PriceUpdateItem[]>([]);
  const [ipChanges, setIpChanges] = useState<Array<IpChange>>([]);

  // 获取代理商列表
  const { data: agentResponse } = useRequest(
    async () => getAgentList({ page: 1, pageSize: 1000, status: 1 }),
    { 
      cacheKey: 'agentList',
      ready: !isAgent
    }
  );
  const agents = agentResponse?.data?.list || [];

  // 获取代理商的用户列表
  const { data: userResponse } = useRequest(
    async () => {
      if (isAgent && user?.id) {
        return searchUsers({
          page: 1,
          pageSize: 1000,
          agentId: user.id
        });
      }
      return { code: 0, data: { list: [], total: 0 } };
    },
    {
      cacheKey: 'agentUserList',
      ready: !!isAgent && !!user?.id
    }
  );
  const userList = userResponse?.data?.list || [];

  // 处理代理商/用户选择
  const handleAgentChange = async (value: number | null) => {
    if (value === null) {
      setSelectedAgent(null);
      setIsGlobal(true);
      return;
    }

    setIsGlobal(false);

    try {
      if (isAgent) {
        // 代理商模式下,value 是用户ID
        const selectedUser = userList.find(u => u.id === value);
        if (selectedUser) {
          const agentInfo: AgentInfo = {
            id: value,
            username: selectedUser.username,
            app_username: selectedUser.app_username || selectedUser.username,
            balance: selectedUser.balance || 0,
            status: selectedUser.status || 'active',
            created_at: selectedUser.created_at,
            updated_at: selectedUser.updated_at,
            total_income: 0,
            total_expense: 0,
            total_profit: 0,
            total_orders: 0,
            total_users: 0
          };
          setSelectedAgent(agentInfo);
          loadPrices();
        }
      } else {
        // 管理员模式下,value 是代理商ID
        const agent = agents.find(a => a.id === value);
        if (agent) {
          setSelectedAgent(agent);
          loadPrices();
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    }
  };

  // 加载价格数据
  const loadPrices = async () => {
    try {
      debug.log('开始加载价格数据:', {
        user,
        selectedAgent,
        isGlobal,
        isAgent
      });

      // 简化逻辑:如果选择了用户就用选择的用户名,否则用当前登录用户名
      const appUsername = selectedAgent?.app_username || user?.app_username || user?.username;
      
      if (!appUsername) {
        debug.error('无法获取用户名');
        message.error('无法获取用户名信息，请确保已登录');
        return;
      }

      setLoading(true);
      const [priceResponse, stockResponse] = await Promise.all([
        getProductPrices({ 
          is_global: isGlobal,
          agent_id: selectedAgent?.id,
          user_id: selectedAgent?.id,
          app_username: appUsername,  // 使用统一的用户名逻辑
          proxy_types: [104, 105, 201]
        }),
        getProductStock()
      ]);

      debug.log('价格和库存数据响应:', {
        priceResponse,
        stockResponse
      });
      
      if ((priceResponse.code === 200 || priceResponse.code === 0) && priceResponse.data) {
        const stockMap = (stockResponse.data || []).reduce<Record<string, number>>((acc, item: ProductStock) => {
          acc[item.productId] = item.stock;
          return acc;
        }, {});

        const priceData = priceResponse.data.map((item: ProductPrice) => ({
          ...item,
          key: Number(item.id),
          minAgentPrice: Number(item.minAgentPrice || 0),
          stock: stockMap[item.type] || 0
        }));
        setPrices(priceData);
      } else {
        message.error(priceResponse.message || '加载价格数据失败');
      }
    } catch (error: any) {
      console.error('加载价格失败:', error);
      message.error(error.message || '加载价格数据失败');
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
  }, [selectedAgent, user]);

  useEffect(() => {
    if (prices.length > 0) {
      const types = getUniqueValues<ProductPrice>(prices, 'type').map(type => ({
        text: getMappedValue(PRODUCT_NO_MAP, type),
        value: type
      }));
      
      setFilterOptions({ types });
    }
  }, [prices]);

  const handleEdit = (record: ProductPrice) => {
    setSelectedPrice(record);
    setVisible(true);
  };

  // 处理价格变更
  const handlePriceChange = (id: string, value: number, field: 'price' | 'minAgentPrice') => {
    const newPrices = { ...modifiedPrices };
    if (!newPrices[id]) {
      newPrices[id] = { price: 0, minAgentPrice: 0 };
    }
    newPrices[id][field] = value;
    setModifiedPrices(newPrices);
    setHasChanges(true);
  };

  // 处理IP白名单变更
  const handleIpWhitelistChange = (record: ProductPrice, newIpList: string[]) => {
    debug.log('IP白名单变更:', { productId: record.id, newIpList });
    
    // 创建 IP 变更记录
    const changes: Array<IpChange> = newIpList
      .filter(ip => ip && ip.trim()) // 过滤掉空字符串和只包含空格的字符串
      .map(ip => ({
        productId: typeof record.id === 'string' ? parseInt(record.id, 10) : record.id,
        ip: ip.trim()
      }));
    setIpChanges(changes);
    
    setModifiedPrices(prev => ({
      ...prev,
      [record.id]: {
        ...prev[record.id],
        price: prev[record.id]?.price || record.price,
        minAgentPrice: prev[record.id]?.minAgentPrice || record.minAgentPrice || 0,
        ipWhitelist: newIpList.length === 0 ? [''] : newIpList
      }
    }));
    setHasChanges(true);
  };

  // 应用价格变更
  const handleApplyChanges = async () => {
    try {
      // 使用相同的用户名获取逻辑
      const appUsername = selectedAgent?.app_username || user?.app_username || user?.username;
      
      if (!appUsername) {
        message.error('无法获取用户名信息，请确保已登录');
        return;
      }

      // 更新价格和IP白名单
      const priceChanges = Object.entries(modifiedPrices).map(([id, values]) => {
        const productId = Number(id);
        const product = prices.find(p => p.id === productId);
        if (!product) {
          console.warn(`未找到产品信息: ${id}, 跳过处理`);
          return null;
        }

        return {
          product_id: productId,
          type: product.type,
          proxy_type: product.proxyType,
          price: values.price,
          min_agent_price: values.minAgentPrice,
          agent_id: selectedAgent?.id,
          user_id: selectedAgent?.id,
          app_username: appUsername,
          ip_whitelist: values.ipWhitelist?.filter(ip => ip && ip.trim()) || []  // 添加IP白名单数据
        } as PriceUpdateItem;
      }).filter((item): item is PriceUpdateItem => item !== null);

      if (priceChanges.length > 0) {
        const requestData = {
          prices: priceChanges,
          agent_id: selectedAgent?.id,
          user_id: selectedAgent?.id,
          app_username: appUsername
        };

        console.log('发送价格和IP白名单更新请求:', requestData);
        await batchUpdateProductPriceSettings(requestData);
        message.success('价格和IP白名单更新成功');

        // 重置状态
        setModifiedPrices({});
        setHasChanges(false);
        setPriceChanges([]);
        setIpChanges([]);
        
        // 重新加载价格数据
        await loadPrices();
      }
    } catch (error: any) {
      console.error('更新价格失败:', error);
      message.error(error.message || '更新失败');
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
      title: (
        <Space>
          价格
          <Tooltip title={isAgent ? "此处设置的价格为用户特定价格" : "此处设置的价格为系统全局默认价格"}>
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
          onChange={(value) => handlePriceChange(String(record.id), value || 0, 'price')}
          prefix="¥"
        />
      )
    },
    ...(!isAgent ? [{
      title: (
        <Space>
          最低代理价格
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
          onChange={(value) => handlePriceChange(String(record.id), value || 0, 'minAgentPrice')}
          prefix="¥"
          disabled={!isGlobal}
        />
      )
    }] : []),
    {
      title: 'IP白名单',
      key: 'ipWhitelist',
      width: 300,
      render: (_: any, record: ProductPrice) => (
        <IpWhitelistInput
          value={modifiedPrices[record.id]?.ipWhitelist ?? record.ipWhitelist ?? ['']}
          onChange={(value) => handleIpWhitelistChange(record, value)}
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
    }
  ].filter(Boolean);

  // 渲染选择器部分
  const renderSelector = () => (
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
                {user.username || user.app_username || '未命名用户'}
              </Option>
            ))
          ) : (
            agents.map(agent => (
              <Option key={agent.id} value={agent.id}>
                {agent.username || '未命名代理商'}
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
  );

  return (
    <div className="dynamic-product-page">
      <Card title="动态代理产品管理" bordered={false}>
        <Alert
          message="价格说明"
          description={
            <ul>
              <li>动态代理产品包括：104、105、201类型</li>
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
          {renderSelector()}

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