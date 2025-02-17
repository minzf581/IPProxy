import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Typography, Select, Input, InputNumber, Alert } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Key } from 'react';
import type { ColumnType } from 'antd/es/table';
import { useAuth } from '@/hooks/useAuth';
import { 
  getDynamicProxyProducts,
  createProxyUser 
} from '@/services/businessService';
import { 
  getAgentList,
  getAgentUsers 
} from '@/services/agentService';
import type { 
  ProductPrice,
  AgentInfo,
  AgentUser,
  DynamicBusinessOrder
} from '@/types/business';
import type {
  DynamicProxyProduct,
  DynamicProxyResponse,
  DynamicProxyArea,
  DynamicProxyCountry,
  DynamicProxyCity
} from '@/types/dynamicProxy';
import { UserRole } from '@/types/user';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import { useRequest } from 'ahooks';
import styles from './DynamicBusiness.module.less';

const { Option } = Select;
const { Text } = Typography;

interface SelectedAgent {
  id: number;
  name: string;
  username: string;
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
  const [quantity, setQuantity] = useState<number>(0);
  const [remark, setRemark] = useState<string>('');
  const [areaList, setAreaList] = useState<DynamicProxyArea[]>([]);

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
    const requestId = new Date().getTime().toString();
    console.log('[动态代理页面] [请求ID:%s] 开始加载余额', requestId, {
      userId,
      isAgent,
      currentUserId: user?.id,
      timestamp: new Date().toISOString()
    });

    try {
      if (isAgent && userId) {
        // 如果是代理商，加载选中用户的余额
        console.log('[动态代理页面] [请求ID:%s] 代理商加载用户余额', requestId, {
          userId,
          userListLength: userList.length,
          availableUsers: userList.map(u => ({ id: u.id, username: u.username }))
        });

        const targetUser = userList.find(u => u.id === userId);
        if (targetUser) {
          console.log('[动态代理页面] [请求ID:%s] 找到目标用户', requestId, {
            userId: targetUser.id,
            username: targetUser.username,
            balance: targetUser.balance
          });
          setBalance(targetUser.balance || 0);
        } else {
          console.warn('[动态代理页面] [请求ID:%s] 未找到目标用户', requestId, {
            userId,
            userListLength: userList.length
          });
          setBalance(0);
        }
      } else if (!isAgent && userId) {
        // 如果是管理员，加载选中代理商的余额
        console.log('[动态代理页面] [请求ID:%s] 管理员加载代理商余额', requestId, {
          userId,
          timestamp: new Date().toISOString()
        });

        const response = await getAgentList({ page: 1, pageSize: 100, status: 1 });
        console.log('[动态代理页面] [请求ID:%s] 获取代理商列表响应', requestId, {
          code: response.code,
          total: response.data?.total,
          listLength: response.data?.list?.length
        });

        if (response.code === 0 && response.data) {
          const agent = response.data.list.find((a: AgentInfo) => Number(a.id) === userId);
          if (agent) {
            console.log('[动态代理页面] [请求ID:%s] 找到目标代理商', requestId, {
              agentId: agent.id,
              username: agent.username,
              balance: agent.balance
            });
            setBalance(agent.balance || 0);
          } else {
            console.warn('[动态代理页面] [请求ID:%s] 未找到目标代理商', requestId, {
              userId,
              agentListLength: response.data.list.length
            });
            setBalance(0);
          }
        } else {
          console.error('[动态代理页面] [请求ID:%s] 获取代理商列表失败', requestId, {
            code: response.code,
            message: response.message
          });
          setBalance(0);
        }
      } else {
        console.log('[动态代理页面] [请求ID:%s] 重置余额为0', requestId, {
          reason: '未提供用户ID或非代理商角色'
        });
        setBalance(0);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[动态代理页面] [请求ID:%s] 获取余额失败', requestId, {
        error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      message.error('获取余额失败');
    }
  };

  // 加载产品列表
  const loadProducts = async (userId?: number) => {
    console.log('[动态代理页面] 开始加载产品列表, 用户ID:', userId);
    try {
      setLoading(true);
      
      // 调用新的动态代理产品列表API
      const response = await getDynamicProxyProducts();
      console.log('[动态代理页面] API响应:', response);
      
      // 检查response.data是否存在
      if (!response || !response.data) {
        console.warn('[动态代理页面] 响应数据为空:', response);
        message.error('获取产品列表失败: 响应数据为空');
        return;
      }
      
      // 检查response.data.data是否存在（因为axios会自动包装一层data）
      const productData = response.data.data;
      if (!productData) {
        console.warn('[动态代理页面] 产品数据为空:', response.data);
        message.error('获取产品列表失败: 产品数据为空');
        return;
      }
      
      console.log('[动态代理页面] 获取到产品数据:', productData);
      
      // 确保productData是数组
      if (!Array.isArray(productData)) {
        console.warn('[动态代理页面] 产品数据不是数组:', productData);
        message.error('获取产品列表失败: 数据格式错误');
        return;
      }
      
      // 直接使用返回的产品数据
      const formattedProducts = productData.map((product: any) => ({
        id: product.productNo,
        type: product.productNo,
        proxyType: 104,
        area: product.areaCode || 'GLOBAL',
        country: product.countryCode || 'ALL',
        city: product.cityCode || 'ALL',
        price: product.price || 0,
        status: product.status || 1,
        areaName: product.areaCode === 'GLOBAL' ? '全球' : (AREA_MAP[product.areaCode] || product.areaCode || '全球'),
        countryName: product.countryCode === 'ALL' ? '所有国家' : (COUNTRY_MAP[product.countryCode] || product.countryCode || '所有国家'),
        cityName: product.cityCode === 'ALL' ? '所有城市' : (CITY_MAP[product.cityCode] || product.cityCode || '所有城市')
      }));
      
      console.log('[动态代理页面] 格式化后的产品数据:', formattedProducts);
      
      // 提取所有筛选选项
      const areas = getUniqueValues(formattedProducts, 'area').map(code => ({
        text: code === 'GLOBAL' ? '全球' : (AREA_MAP[code] || code || '全球'),
        value: code
      }));
      
      const countries = getUniqueValues(formattedProducts, 'country').map(code => ({
        text: code === 'ALL' ? '所有国家' : (COUNTRY_MAP[code] || code || '所有国家'),
        value: code
      }));
      
      const cities = getUniqueValues(formattedProducts, 'city').map(code => ({
        text: code === 'ALL' ? '所有城市' : (CITY_MAP[code] || code || '所有城市'),
        value: code
      }));
      
      setProducts(formattedProducts);
      setFilterOptions({
        ...filterOptions,
        areas,
        countries,
        cities
      });
      
      console.log('[动态代理页面] 更新后的状态:', {
        products: formattedProducts,
        filterOptions: {
          ...filterOptions,
          areas,
          countries,
          cities
        }
      });
      
    } catch (error) {
      console.error('[动态代理页面] 加载产品列表失败:', error);
      message.error('加载产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化时如果是代理商，自动设置selectedAgent
  useEffect(() => {
    if (isAgent && user?.id) {
      setSelectedAgent({ id: user.id, name: user.username || '', username: user.username || '' });
      loadBalance(user.id);
      loadProducts(user.id);
    }
  }, [isAgent, user]);

  // 处理代理商/用户选择
  const handleAgentChange = async (value: number | undefined) => {
    console.log('[动态代理页面] 选择用户/代理商:', {
      value,
      isAgent,
      userId: user?.id,
      currentRole: isAgent ? 'agent' : 'admin'
    });

    try {
      if (isAgent && user?.id) {
        // 如果是代理商，只允许选择自己的用户
        const targetId = value || user.id;
        console.log('[动态代理页面] 代理商选择用户:', {
          targetId,
          availableUsers: userList.map(u => ({ id: u.id, username: u.username }))
        });
        
        setSelectedAgent({ id: targetId, name: '', username: '' });
        await loadBalance(targetId);
        await loadProducts(targetId);
      } else {
        console.log('[动态代理页面] 管理员选择代理商:', {
          value,
          availableAgents: agents.map(a => ({ id: a.id, username: a.username }))
        });
        
        setSelectedAgent(value ? { id: value, name: '', username: '' } : null);
        await loadBalance(value);
        if (value) {
          await loadProducts(value);
        } else {
          setAreaList([]);
          setFilterOptions({
            types: [],
            areas: [],
            countries: [],
            cities: []
          });
          console.log('[动态代理页面] 清空选择和数据');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[动态代理页面] 处理用户/代理商选择失败:', {
        error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      message.error('选择失败: ' + errorMessage);
    }
  };

  // 处理数量变更
  const handleQuantityChange = (value: number | null) => {
    setQuantity(value || 0);
  };

  // 处理备注变更
  const handleRemarkChange = (value: string) => {
    setRemark(value);
  };

  // 提交订单
  const handleSubmit = async () => {
    if (!selectedAgent || !quantity) {
      message.error('请选择代理商和输入流量');
      return;
    }

    try {
      setLoading(true);
      const response = await createProxyUser({
        appUsername: selectedAgent.username,
        limitFlow: quantity,
        remark
      });

      if (response.code === 0) {
        message.success('订单提交成功');
        // 重新加载余额
        await loadBalance(selectedAgent.id);
        // 清空表单
        setQuantity(0);
        setRemark('');
      } else {
        message.error(response.message || '订单提交失败');
      }
    } catch (error) {
      console.error('[动态代理页面] 提交订单失败:', error);
      message.error('提交订单失败');
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
          value={quantity}
          onChange={handleQuantityChange}
          style={{ width: '100%' }}
          placeholder="请输入流量"
        />
      )
    },
    {
      title: '总价(元)',
      dataIndex: 'totalPrice',
      render: (_: unknown, record: ProductPrice) => {
        const totalPrice = quantity * record.price;
        return <Text strong>¥{totalPrice.toFixed(2)}</Text>;
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (_: unknown, record: ProductPrice) => (
        <Input
          value={remark}
          onChange={(e) => handleRemarkChange(e.target.value)}
          placeholder="请输入备注"
        />
      )
    }
  ];

  return (
    <PageContainer>
      <Card className={styles.dynamicBusinessPage}>
        <Alert
          message="业务说明"
          description={
            <>
              <p>1. 动态代理按流量计费，最小购买单位为1GB</p>
              <p>2. 流量有效期为30天</p>
              <p>3. 支持HTTP/HTTPS/SOCKS5协议</p>
            </>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space direction="vertical" size="small">
              <div>{isAgent ? '选择用户' : '开通对象'}</div>
              {isAgent && userList.length > 0 && (
                <Select
                  placeholder="选择用户"
                  style={{ width: 200 }}
                  onChange={handleAgentChange}
                  allowClear
                >
                  {userList.map(user => (
                    <Option key={user.id} value={user.id}>{user.username}</Option>
                  ))}
                </Select>
              )}

              {!isAgent && agents.length > 0 && (
                <Select
                  placeholder="选择代理商"
                  style={{ width: 200 }}
                  onChange={handleAgentChange}
                  allowClear
                >
                  {agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>{agent.username}</Option>
                  ))}
                </Select>
              )}
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

          <div className={styles.actionSection}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={
                (!isAgent && !selectedAgent) || // 非代理商必须选择代理商
                quantity <= 0 // 流量必须大于0
              }
            >
              提交订单
            </Button>
          </div>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default DynamicBusiness;