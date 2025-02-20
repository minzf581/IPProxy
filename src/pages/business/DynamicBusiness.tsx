import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Table, Button, Space, Typography, Select, Input, InputNumber, Alert, message, Modal } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Key } from 'react';
import type { ColumnType } from 'antd/es/table';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import { 
  getDynamicProxyProducts,
  createProxyUser,
  extractDynamicProxy
} from '@/services/businessService';
import { 
  getAgentList,
  getAgentUsers 
} from '@/services/agentService';
import type { 
  ProductPrice,
  AgentInfo,
  AgentUser,
  DynamicBusinessOrder,
  BusinessResponse
} from '@/types/business';
import type {
  DynamicProxyProduct,
  DynamicProxyResponse,
  DynamicProxyArea,
  DynamicProxyCountry,
  DynamicProxyCity,
  ExtractConfig,
  ExtractResponse
} from '@/types/dynamicProxy';
import {
  ExtractMethod,
  Protocol,
  DataFormat,
  Delimiter
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
  extractConfig: ExtractConfig;
}

interface AreaResponse {
  areaCode?: string;
  areaName?: string;
  countries?: Array<{
    countryCode?: string;
    countryName?: string;
    states?: Array<{
      code?: string;
      stateCode?: string;
      name?: string;
      stateName?: string;
    }>;
    cities?: Array<{
      cityCode?: string;
      code?: string;
      cityName?: string;
      name?: string;
    }>;
  }>;
}

interface DynamicProxyAreaData {
  areaCode: string;
  areaName: string;
  countries: Array<{
    countryCode: string;
    countryName: string;
    states: Array<{
      code: string;
      name: string;
    }>;
    cities: Array<{
      cityCode: string;
      cityName: string;
    }>;
  }>;
}

interface FilterOption {
  value: string;
  text: string;
}

interface FilterOptions {
  types: FilterOption[];
  areas: FilterOption[];
  countries: FilterOption[];
  states: FilterOption[];
  cities: FilterOption[];
}

const DynamicBusinessContent: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === UserRole.AGENT;
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    types: { text: string; value: string }[];
    areas: { text: string; value: string }[];
    states: { text: string; value: string }[];
    countries: { text: string; value: string }[];
    cities: { text: string; value: string }[];
  }>({
    types: [],
    areas: [],
    states: [],
    countries: [],
    cities: [],
  });
  const [quantity, setQuantity] = useState<number>(0);
  const [remark, setRemark] = useState<string>('');
  const [areaList, setAreaList] = useState<DynamicProxyAreaData[]>([]);
  const [userList, setUserList] = useState<AgentUser[]>([]);
  const [extractConfig, setExtractConfig] = useState<ExtractConfig>({
    method: ExtractMethod.PASSWORD,
    quantity: 1,
    validTime: 5,
    protocol: Protocol.SOCKS5,
    dataFormat: DataFormat.TXT,
    delimiter: Delimiter.CRLF
  });
  const [extractedUrl, setExtractedUrl] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductPrice | null>(null);

  console.log('[DynamicBusiness] 组件渲染:', {
    user,
    isAgent,
    loading,
    balance,
    selectedAgent,
    productsCount: products.length,
    userListCount: userList.length,
    timestamp: new Date().toISOString()
  });

  // 获取代理商列表
  const { data: agentResponse } = useRequest(
    async () => {
      console.log('[DynamicBusiness] 开始获取代理商列表');
      const response = await getAgentList({ page: 1, pageSize: 1000, status: 1 });
      console.log('[DynamicBusiness] 代理商列表响应:', response);
      return response.data;
    },
    { 
      cacheKey: 'agentList',
      ready: !isAgent,
      onSuccess: (data) => {
        console.log('[DynamicBusiness] 获取代理商列表成功:', {
          total: data?.total,
          listLength: data?.list?.length
        });
      },
      onError: (error) => {
        console.error('[DynamicBusiness] 获取代理商列表失败:', error);
      }
    }
  );
  const agents = agentResponse?.list || [];

  // 获取代理商的用户列表
  const { data: userListResponse } = useRequest(
    async () => {
      console.log('[DynamicBusiness] 开始获取用户列表:', {
        isAgent,
        userId: user?.id
      });
      
      if (isAgent && user?.id) {
        const response = await getAgentUsers({
          agentId: user.id,
          page: 1,
          pageSize: 1000,
          status: 'active'
        });
        console.log('[DynamicBusiness] 用户列表响应:', response);
        
        if (response?.list) {
          setUserList(response.list);
        }
        return response;
      }
      return { list: [], total: 0 };
    },
    {
      cacheKey: 'agentUserList',
      ready: !!isAgent && !!user?.id,
      onSuccess: (data) => {
        console.log('[DynamicBusiness] 获取用户列表成功:', {
          total: data?.total,
          listLength: data?.list?.length
        });
        
        if (data?.list) {
          setUserList(data.list);
          // 如果是代理商，初始化时加载自己的余额
          if (isAgent && user?.id) {
            loadBalance(user.id);
          }
        }
      },
      onError: (error) => {
        console.error('[DynamicBusiness] 获取用户列表失败:', error);
      }
    }
  );

  useEffect(() => {
    console.log('[DynamicBusiness] ResourceList 组件属性:', {
      userId: user?.id,
      username: user?.username,
      isAgent,
      timestamp: new Date().toISOString()
    });
  }, [user, isAgent]);

  // 加载余额
  const loadBalance = async (userId?: number) => {
    try {
      if (isAgent && user?.id) {
        const response = await request<BusinessResponse>(`/api/dashboard/agent/${user.id}`, {
          method: 'GET'
        });
        
        if (response.data?.code === 0 && response.data?.data) {
          setBalance(response.data.data.agent.balance || 0);
        } else {
          message.error('获取余额失败');
        }
      }
    } catch (error) {
      console.error('获取余额失败:', error);
      message.error('获取余额失败');
    }
  };

  // 修改 loadProducts 函数
  const loadProducts = async (userId?: number) => {
    try {
      setLoading(true);
      const response = await getDynamicProxyProducts();
      console.log('[DynamicBusiness] 获取产品响应:', response);
      
      if (response.code === 0 && response.data) {
        const products = response.data.map((item: any) => ({
          id: item.id,
          key: item.id,
          name: item.name || item.productName,
          type: item.type || item.productNo,
          proxyType: item.proxyType || 104,
          flow: item.flow || 0,
          duration: item.duration || 0,
          unit: item.unit || 1,
          area: item.area || '',
          country: item.country || '',
          state: item.state || '',
          city: item.city || '',
          price: item.price || 0,
          status: item.status || 1
        }));
        
        console.log('[DynamicBusiness] 处理后的产品数据:', products);
        setProducts(products);
        
        // 如果有产品，自动加载第一个产品的区域列表并设置为选中产品
        if (products.length > 0) {
          const firstProduct = products[0];
          setSelectedProduct(firstProduct);
        }
      }
    } catch (error) {
      console.error('[DynamicBusiness] 加载产品列表失败:', error);
      message.error('加载产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化时如果是代理商，自动设置selectedAgent
  useEffect(() => {
    if (isAgent && user?.id) {
      setSelectedAgent({ id: user.id, name: user.username || '', username: user.username || '' });
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
            states: [],
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

  const handleExtractMethodChange = (value: ExtractMethod) => {
    setExtractConfig(prev => ({
      ...prev,
      method: value,
      // 重置相关字段为默认值
      quantity: value === ExtractMethod.PASSWORD ? 1 : undefined,
      validTime: value === ExtractMethod.PASSWORD ? 5 : undefined,
      protocol: value === ExtractMethod.API ? Protocol.SOCKS5 : undefined,
      dataFormat: value === ExtractMethod.API ? DataFormat.TXT : undefined,
      delimiter: value === ExtractMethod.API ? Delimiter.CRLF : undefined
    }));
  };

  const handleSubmit = async () => {
    console.log('[DynamicBusiness] 开始提取代理:', {
      selectedAgent,
      extractConfig,
      timestamp: new Date().toISOString()
    });

    try {
      setLoading(true);
      const response = await extractDynamicProxy({
        addressCode: selectedProduct?.area || '',
        maxFlowLimit: selectedProduct?.flow || 1000,
        extractConfig
      });

      if (response.code === 0 && response.data?.url) {
        setExtractedUrl(response.data.url);
        setShowUrlModal(true);
        message.success('提取成功');
      } else {
        message.error(response.msg || '提取失败');
      }
    } catch (error) {
      console.error('[DynamicBusiness] 提取失败:', error);
      message.error('提取失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 添加数据监控
  useEffect(() => {
    console.log('[DynamicBusiness] 产品数据更新:', {
      productsCount: products.length,
      products: products.map(p => ({
        id: p.id,
        area: p.area,
        country: p.country,
        state: p.state,
        city: p.city
      }))
    });
  }, [products]);

  useEffect(() => {
    console.log('[DynamicBusiness] 过滤选项更新:', {
      areas: filterOptions.areas.length,
      countries: filterOptions.countries.length,
      states: filterOptions.states.length,
      cities: filterOptions.cities.length,
      areaOptions: filterOptions.areas
    });
  }, [filterOptions]);

  useEffect(() => {
    console.log('[DynamicBusiness] 选中产品更新:', selectedProduct);
  }, [selectedProduct]);

  // 修改区域列表加载函数
  const loadAreaList = async (proxyType: number, productNo?: string) => {
    try {
      if (!proxyType || !productNo) {
        console.warn('[DynamicBusiness] 加载区域列表缺少必要参数:', { proxyType, productNo });
        return;
      }

      console.log('[DynamicBusiness] 开始加载区域列表:', { proxyType, productNo });
      const response = await request.get('/api/business/areas', {
        params: { proxyType, productNo }
      });
      console.log('[DynamicBusiness] 区域列表原始响应:', response);

      if (response.data?.data) {
        const areas = response.data.data;
        setAreaList(areas); // 保存原始区域数据

        const options = buildFilterOptions(areas);
        setFilterOptions(options);
      }
    } catch (error) {
      console.error('[DynamicBusiness] 加载区域列表失败:', error);
      message.error('加载区域列表失败');
    }
  };

  // 添加构建过滤选项的函数
  const buildFilterOptions = (areas: DynamicProxyAreaData[]): FilterOptions => {
    const options: FilterOptions = {
      types: [],
      areas: [],
      countries: [],
      states: [],
      cities: []
    };

    areas.forEach((area: DynamicProxyAreaData) => {
      if (area.areaCode) {
        options.areas.push({
          value: area.areaCode,
          text: area.areaName || area.areaCode
        });
      }

      area.countries?.forEach(country => {
        if (country.countryCode) {
          options.countries.push({
            value: country.countryCode,
            text: country.countryName || country.countryCode
          });
        }

        country.states?.forEach(state => {
          if (state.code) {
            options.states.push({
              value: state.code,
              text: state.name || state.code
            });
          }
        });

        country.cities?.forEach(city => {
          if (city.cityCode) {
            options.cities.push({
              value: city.cityCode,
              text: city.cityName || city.cityCode
            });
          }
        });
      });
    });

    return options;
  };

  // 添加 memo 优化
  const AreaSelector = React.memo(({ record, filterOptions, onAreaChange }: {
    record: ProductPrice;
    filterOptions: FilterOptions;
    onAreaChange: (value: string, record: ProductPrice) => void;
  }) => {
    if (!record || !record.type) {
      return null;
    }

    const currentArea = record.area || '';
    const currentCountry = record.country || '';
    const currentState = record.state || '';
    const currentCity = record.city || '';

    return (
      <Space>
        <Select
          value={currentArea}
          style={{ width: 120 }}
          onChange={(value) => onAreaChange(value, record)}
          options={filterOptions.areas}
          placeholder="选择区域"
        />
        {currentArea && (
          <Select
            value={currentCountry}
            style={{ width: 120 }}
            onChange={(value) => handleCountryChange(value, record)}
            options={filterOptions.countries.filter(c => c.value.startsWith(currentArea))}
            placeholder="选择国家"
          />
        )}
        {currentCountry && (
          <Select
            value={currentState}
            style={{ width: 120 }}
            onChange={(value) => handleStateChange(value, record)}
            options={filterOptions.states.filter(s => s.value.startsWith(currentCountry))}
            placeholder="选择州/省"
          />
        )}
        {currentCountry && (
          <Select
            value={currentCity}
            style={{ width: 120 }}
            onChange={(value) => handleCityChange(value, record)}
            options={filterOptions.cities.filter(c => c.value.startsWith(currentCountry))}
            placeholder="选择城市"
          />
        )}
      </Space>
    );
  });

  // 修改 columns 定义
  const columns = useMemo(() => {
    // 处理区域变更
    const handleAreaChange = useCallback((value: string, record: ProductPrice) => {
      if (!record || !record.type) {
        return;
      }

      const updatedProducts = products.map(p => {
        if (p.type === record.type) {
          return {
            ...p,
            area: value,
            country: '',
            state: '',
            city: ''
          };
        }
        return p;
      });

      setProducts(updatedProducts);
      setSelectedProduct(updatedProducts.find(p => p.type === record.type) || null);
    }, [products]);

    return [
      {
        title: '资源类型',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type: string) => getMappedValue(PRODUCT_NO_MAP, type)
      },
      {
        title: '区域',
        dataIndex: 'area',
        key: 'area',
        width: 120,
        render: (_: any, record: ProductPrice) => (
          <AreaSelector
            record={record}
            filterOptions={filterOptions}
            onAreaChange={handleAreaChange}
          />
        )
      },
      {
        title: '州/省',
        dataIndex: 'state',
        key: 'state',
        width: 120,
        render: (_: any, record: ProductPrice) => (
          <Select
            style={{ width: '100%' }}
            value={record.state}
            onChange={(value) => handleStateChange(value, record)}
          >
            {filterOptions.states
              .filter(option => {
                // 只显示当前选中区域和国家的州
                const area = areaList.find(a => a.areaCode === record.area);
                const country = area?.countries?.find(c => c.countryCode === record.country);
                return country?.states?.some(s => s.code === option.value);
              })
              .map(option => (
                <Option key={option.value} value={option.value}>
                  {option.text}
                </Option>
              ))}
          </Select>
        )
      },
      {
        title: '国家',
        dataIndex: 'country',
        key: 'country',
        width: 120,
        render: (_: any, record: ProductPrice) => (
          <Select
            style={{ width: '100%' }}
            value={record.country}
            onChange={(value) => handleCountryChange(value, record)}
          >
            {filterOptions.countries
              .filter(option => {
                // 只显示当前选中区域的国家
                const area = areaList.find(a => a.areaCode === record.area);
                return area?.countries?.some(c => c.countryCode === option.value);
              })
              .map(option => (
                <Option key={option.value} value={option.value}>
                  {option.text}
                </Option>
              ))}
          </Select>
        )
      },
      {
        title: '城市',
        dataIndex: 'city',
        key: 'city',
        width: 120,
        render: (_: any, record: ProductPrice) => (
          <Select
            style={{ width: '100%' }}
            value={record.city}
            onChange={(value) => handleCityChange(value, record)}
          >
            {filterOptions.cities
              .filter(option => {
                // 只显示当前选中国家的城市
                const area = areaList.find(a => a.areaCode === record.area);
                const country = area?.countries?.find(c => c.countryCode === record.country);
                return country?.cities?.some(c => c.cityCode === option.value);
              })
              .map(option => (
                <Option key={option.value} value={option.value}>
                  {option.text}
                </Option>
              ))}
          </Select>
        )
      },
      {
        title: '流量(M)',
        dataIndex: 'flow',
        key: 'flow',
        width: 120,
        render: (flow: number, record: ProductPrice) => (
          <InputNumber
            min={1}
            value={flow || 0}
            onChange={(value) => handleFlowChange(value, record)}
            style={{ width: '100%' }}
          />
        )
      },
      {
        title: '单价',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        render: (price: number) => `¥${price}`
      },
      {
        title: '总价(元)',
        dataIndex: 'price',
        key: 'totalPrice',
        width: 120,
        render: (price: number, record: ProductPrice) => 
          `¥${((record.flow || 0) * price / 1024).toFixed(2)}`  // 将M转换为G计算价格
      }
    ];
  }, [products, filterOptions]);

  // 在加载产品列表后调用获取区域列表
  useEffect(() => {
    if (products.length > 0) {
      const firstProduct = products[0];
      loadAreaList(104, firstProduct.type);
    }
  }, [products]);

  useEffect(() => {
    if (selectedProduct?.proxyType && selectedProduct?.type) {
      loadAreaList(selectedProduct.proxyType, selectedProduct.type);
    }
  }, [selectedProduct?.proxyType, selectedProduct?.type]);

  useEffect(() => {
    if (areaList.length > 0) {
      console.log('[DynamicBusiness] 开始处理区域列表数据:', areaList);
      
      const areas: FilterOption[] = [];
      const countries: FilterOption[] = [];
      const states: FilterOption[] = [];
      const cities: FilterOption[] = [];

      areaList.forEach(area => {
        console.log('[DynamicBusiness] 处理区域:', {
          areaCode: area.areaCode,
          areaName: area.areaName,
          countriesCount: area.countries?.length
        });

        areas.push({
          value: area.areaCode,
          text: area.areaName
        });

        area.countries?.forEach(country => {
          console.log('[DynamicBusiness] 处理国家:', {
            countryCode: country.countryCode,
            countryName: country.countryName,
            statesCount: country.states?.length,
            citiesCount: country.cities?.length
          });

          countries.push({
            value: country.countryCode,
            text: country.countryName
          });

          country.states?.forEach(state => {
            states.push({
              value: state.code,
              text: state.name
            });
          });

          country.cities?.forEach(city => {
            cities.push({
              value: city.cityCode,
              text: city.cityName
            });
          });
        });
      });

      console.log('[DynamicBusiness] 过滤选项统计:', {
        areas: areas.length,
        countries: countries.length,
        states: states.length,
        cities: cities.length
      });

      setFilterOptions(prev => ({
        ...prev,
        areas,
        countries,
        states,
        cities
      }));
    }
  }, [areaList]);

  // 处理国家变更
  const handleCountryChange = useCallback((value: string, record: ProductPrice) => {
    if (!record || !record.type) {
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.type === record.type) {
        return {
          ...p,
          country: value,
          state: '',
          city: ''
        };
      }
      return p;
    });

    setProducts(updatedProducts);
  }, [products]);

  // 处理州/省变更
  const handleStateChange = useCallback((value: string, record: ProductPrice) => {
    if (!record || !record.type) {
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.type === record.type) {
        return {
          ...p,
          state: value,
          city: ''
        };
      }
      return p;
    });

    setProducts(updatedProducts);
  }, [products]);

  // 处理城市变更
  const handleCityChange = useCallback((value: string, record: ProductPrice) => {
    if (!record || !record.type) {
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.type === record.type) {
        return {
          ...p,
          city: value
        };
      }
      return p;
    });

    setProducts(updatedProducts);
  }, [products]);

  // 处理流量变更
  const handleFlowChange = useCallback((value: number | null, record: ProductPrice) => {
    if (!record || !record.type) {
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.type === record.type) {
        return {
          ...p,
          flow: value || 0
        };
      }
      return p;
    });

    setProducts(updatedProducts);
  }, [products]);

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

          <Card title="提取配置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Select
                  style={{ width: 120 }}
                  value={extractConfig.method}
                  onChange={handleExtractMethodChange}
                >
                  <Option value={ExtractMethod.PASSWORD}>帐密提取</Option>
                  <Option value={ExtractMethod.API}>API提取</Option>
                </Select>

                {extractConfig.method === ExtractMethod.PASSWORD && (
                  <>
                    <InputNumber
                      min={1}
                      max={100}
                      value={extractConfig.quantity}
                      onChange={value => setExtractConfig(prev => ({ ...prev, quantity: value || 1 }))}
                      placeholder="数量"
                      addonAfter="个"
                    />
                    <InputNumber
                      min={1}
                      max={120}
                      value={extractConfig.validTime}
                      onChange={value => setExtractConfig(prev => ({ ...prev, validTime: value || 5 }))}
                      placeholder="有效时间"
                      addonAfter="分钟"
                    />
                  </>
                )}

                {extractConfig.method === ExtractMethod.API && (
                  <>
                    <Select
                      style={{ width: 120 }}
                      value={extractConfig.protocol}
                      onChange={value => setExtractConfig(prev => ({ ...prev, protocol: value }))}
                    >
                      <Option value={Protocol.SOCKS5}>SOCKS5</Option>
                      <Option value={Protocol.HTTP}>HTTP</Option>
                    </Select>
                    <Select
                      style={{ width: 120 }}
                      value={extractConfig.dataFormat}
                      onChange={value => setExtractConfig(prev => ({ ...prev, dataFormat: value }))}
                    >
                      <Option value={DataFormat.TXT}>TXT</Option>
                      <Option value={DataFormat.JSON}>JSON</Option>
                    </Select>
                    {extractConfig.dataFormat === DataFormat.TXT && (
                      <Select
                        style={{ width: 120 }}
                        value={extractConfig.delimiter}
                        onChange={value => setExtractConfig(prev => ({ ...prev, delimiter: value }))}
                      >
                        <Option value={Delimiter.CRLF}>\\r\\n</Option>
                        <Option value={Delimiter.BR}>/br</Option>
                        <Option value={Delimiter.CR}>\\r</Option>
                        <Option value={Delimiter.LF}>\\n</Option>
                        <Option value={Delimiter.TAB}>\\t</Option>
                      </Select>
                    )}
                  </>
                )}
              </Space>

              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={loading}
                disabled={!selectedAgent || !selectedProduct}
              >
                提取
              </Button>
            </Space>
          </Card>
        </Space>

        <Modal
          title="提取结果"
          open={showUrlModal}
          onOk={() => {
            navigator.clipboard.writeText(extractedUrl);
            message.success('已复制到剪贴板');
            setShowUrlModal(false);
          }}
          onCancel={() => setShowUrlModal(false)}
          okText="复制"
          cancelText="关闭"
        >
          <Typography.Paragraph copyable>
            {extractedUrl}
          </Typography.Paragraph>
        </Modal>
      </Card>
    </PageContainer>
  );
};

const DynamicBusiness: React.FC = () => {
  return (
    <DynamicBusinessContent />
  );
};

export default DynamicBusiness;