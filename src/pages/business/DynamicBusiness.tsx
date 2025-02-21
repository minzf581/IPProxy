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
  DynamicProxyState,
  ExtractConfig,
  ExtractResponse
} from '@/types/dynamicProxy';
import {
  ExtractMethod,
  Protocol,
  DataFormat,
  Delimiter,
  ExtractParams
} from '@/types/dynamicProxy';
import { UserRole } from '@/types/user';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import { useRequest } from 'ahooks';
import styles from './DynamicBusiness.module.less';
import type { 
  FilterOptions as DynamicFilterOptions
} from '@/types/dynamicProxy';

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

interface FilterOption {
  value: string;
  label: string;
}

interface FilterOptions {
  areas: { value: string; label: string }[];
  countries: { value: string; label: string }[];
  states: { value: string; label: string }[];
  cities: { value: string; label: string }[];
}

interface City {
  cityCode: string;
  cityName: string;
}

interface State {
  code: string;
  name: string;
  cities: City[];
}

interface Country {
  countryCode: string;
  countryName: string;
  states: State[];
  cities: City[];
}

interface DynamicProxyAreaData {
  areaCode: string;
  areaName: string;
  countries: Country[];
}

// 添加区域名称映射
const AREA_NAME_MAP: { [key: string]: string } = {
  '1': '北美洲',
  '2': '欧洲',
  '3': '亚洲',
  '4': '南美洲',
  '5': '大洋洲',
  '6': '非洲',
  '7': '其他地区'
};

interface ExtractResultItem {
  proxyUrl?: string;
  list?: string[];
}

interface ExtractResult {
  list?: ExtractResultItem[];
  url?: string;
}

const DynamicBusinessContent: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === UserRole.AGENT;
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [areaList, setAreaList] = useState<DynamicProxyArea[]>([]);
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
  const [displayedUrl, setDisplayedUrl] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductPrice | null>(null);
  const [areaData, setAreaData] = useState<DynamicProxyAreaData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    areas: [],
    countries: [],
    states: [],
    cities: []
  });

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

  // 修改产品加载函数
  const loadProducts = async (userId?: number) => {
    try {
      setLoading(true);
      console.log('[DynamicBusiness] 开始加载产品列表:', { userId });
      const response = await getDynamicProxyProducts();
      console.log('[DynamicBusiness] 产品列表响应:', response);
      
      if (response.code === 0 && response.data) {
        const products = response.data.map((item: any) => {
          // 记录原始价格数据
          console.log('[DynamicBusiness] 处理产品价格:', {
            id: item.id,
            agentPrice: item.agentPrice,
            price: item.price,
            globalPrice: item.globalPrice
          });

          const price = Number(item.agentPrice) || Number(item.price) || Number(item.globalPrice) || 0;
          console.log('[DynamicBusiness] 最终使用的价格:', price);

          return {
            id: item.id,
            key: item.id,
            name: item.name || item.productName,
            type: item.type || item.productNo,
            proxyType: item.proxyType || 104,
            flow: undefined,
            duration: item.duration || 30,
            unit: item.unit || 1,
            area: item.area || '',
            country: item.country || '',
            state: item.state || '',
            city: item.city || '',
            price: price,
            status: item.status || 1
          };
        });

        console.log('[DynamicBusiness] 处理后的产品列表:', products);

        if (products.length > 0) {
          setProducts(products);
          setSelectedProduct(products[0]);
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
    // Implementation needed
  };

  // 处理备注变更
  const handleRemarkChange = (value: string) => {
    // Implementation needed
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
    try {
      setLoading(true);
      
      // 构建提取参数
      const extractParams: ExtractParams = {
        productNo: selectedProduct?.type || '',
        proxyType: 104,
        flow: selectedProduct?.flow || 1,
        addressCode: selectedProduct?.area || '',
        maxFlowLimit: selectedProduct?.flow || 1,
        extractConfig: extractConfig.method === ExtractMethod.PASSWORD
          ? {
              method: ExtractMethod.PASSWORD,
              quantity: extractConfig.quantity,
              validTime: extractConfig.validTime
            }
          : {
              method: ExtractMethod.API,
              protocol: Protocol.SOCKS5,
              dataFormat: DataFormat.TXT,
              delimiter: Delimiter.CRLF
            }
      };

      console.log('[DynamicBusiness] 提取参数:', extractParams);
      
      const response = await extractDynamicProxy(extractParams);
      console.log('[DynamicBusiness] 原始响应:', response);
      
      // 解构响应数据
      const { data } = response;
      console.log('[DynamicBusiness] 响应data:', data);
      
      if (!data || data.code !== 0) {
        console.error('[DynamicBusiness] 响应错误:', data);
        message.error(data?.message || '提取失败：响应数据格式错误');
        return;
      }

      const responseData = data.data;
      console.log('[DynamicBusiness] 响应业务数据:', responseData);

      if (!responseData) {
        console.error('[DynamicBusiness] 响应中没有业务数据');
        message.error('提取失败：响应数据为空');
        return;
      }

      const { mainAccount, orderInfo, proxyInfo } = responseData;
      console.log('[DynamicBusiness] 解构数据:', {
        mainAccount,
        orderInfo,
        proxyInfo
      });

      if (!proxyInfo) {
        console.error('[DynamicBusiness] 响应中没有proxyInfo');
        message.error('提取失败：未获取到代理信息');
        return;
      }

      // 处理提取结果
      if (extractConfig.method === ExtractMethod.PASSWORD) {
        if (proxyInfo.list && Array.isArray(proxyInfo.list)) {
          const proxyUrls = proxyInfo.list
            .map((item: { proxyUrl?: string }) => item.proxyUrl)
            .filter((url): url is string => !!url);
          if (proxyUrls.length > 0) {
            setExtractedUrl(proxyUrls.join('\n'));
            setDisplayedUrl(proxyUrls.join('\n'));
            setShowUrlModal(true);
            message.success('提取成功');
            // 如果是代理商，刷新余额
            if (selectedAgent) {
              await loadBalance(selectedAgent.id);
            }
            return;
          }
        }
      } else {
        // API提取方式
        if (proxyInfo.list?.[0]?.proxyUrl) {
          setExtractedUrl(proxyInfo.list[0].proxyUrl);
          setDisplayedUrl(proxyInfo.list[0].proxyUrl);
          setShowUrlModal(true);
          message.success('提取成功');
          // 如果是代理商，刷新余额
          if (selectedAgent) {
            await loadBalance(selectedAgent.id);
          }
          return;
        }
      }

      console.error('[DynamicBusiness] 未找到有效的代理URL');
      message.error('提取失败：未获取到有效的代理地址');

    } catch (error: unknown) {
      console.error('[DynamicBusiness] 提取异常:', error);
      message.error(`提取失败：${error instanceof Error ? error.message : '未知错误'}`);
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
      areas: areaList.length,
      countries: areaList.length,
      states: areaList.length,
      cities: areaList.length,
      areaOptions: areaList.map(a => ({
        value: a.areaCode,
        text: a.areaName
      }))
    });
  }, [areaList]);

  useEffect(() => {
    console.log('[DynamicBusiness] 选中产品更新:', selectedProduct);
  }, [selectedProduct]);

  // 处理区域变更
  const handleAreaChange = useCallback((value: string, record: ProductPrice) => {
    console.log('[DynamicBusiness] 区域变更:', {
      value,
      record,
      currentAreaList: areaList
    });

    if (!value || !record) return;

    // 查找选中的区域数据
    const selectedAreaData = areaList.find(area => area.areaCode === value);
    if (!selectedAreaData) {
      console.warn('[DynamicBusiness] 未找到对应的区域数据:', value);
      return;
    }

    console.log('[DynamicBusiness] 选中的区域数据:', {
      areaCode: selectedAreaData.areaCode,
      areaName: selectedAreaData.areaName,
      countriesCount: selectedAreaData.countries?.length || 0
    });

    // 更新产品信息
    const updatedProducts = products.map(p => {
      if (p.type === record.type) {
        return {
          ...p,
          area: value,
          areaName: selectedAreaData.areaName,
          country: '',
          countryName: '',
          state: '',
          stateName: '',
          city: '',
          cityName: ''
        };
      }
      return p;
    });

    setProducts(updatedProducts);

    // 更新过滤选项
    const countries = selectedAreaData.countries || [];
    setFilterOptions(prev => ({
      ...prev,
      countries: countries.map(country => ({
        value: country.countryCode,
        label: country.countryName || '未知国家'
      })),
      states: [],
      cities: []
    }));

    // 更新选中的产品
    if (selectedProduct && selectedProduct.type === record.type) {
      setSelectedProduct({
        ...selectedProduct,
        area: value,
        areaName: selectedAreaData.areaName,
        country: '',
        countryName: '',
        state: '',
        stateName: '',
        city: '',
        cityName: ''
      });
    }
  }, [areaList, products, selectedProduct]);

  // 处理国家变更
  const handleCountryChange = useCallback((value: string, record: ProductPrice) => {
    console.log('[DynamicBusiness] 国家变更:', {
      value,
      record,
      currentAreaList: areaList
    });

    if (!value || !record) return;

    // 查找选中的区域数据
    const selectedAreaData = areaList.find(area => area.areaCode === record.area);
    if (!selectedAreaData) {
      console.warn('[DynamicBusiness] 未找到对应的区域数据:', record.area);
      return;
    }

    // 查找选中的国家数据
    const selectedCountry = selectedAreaData.countries.find(country => country.countryCode === value);
    if (!selectedCountry) {
      console.warn('[DynamicBusiness] 未找到对应的国家数据:', value);
      return;
    }

    // 更新产品信息
    const updatedProducts = products.map(p => {
      if (p.type === record.type) {
        return {
          ...p,
          country: value,
          countryName: selectedCountry.countryName,
          state: '',
          stateName: '',
          city: '',
          cityName: ''
        };
      }
      return p;
    });

    setProducts(updatedProducts);

    // 更新过滤选项
    const states = selectedCountry.states || [];
    setFilterOptions(prev => ({
      ...prev,
      states: states.map(state => ({
        value: state.code,
        label: state.name || '未知州/省'
      })),
      cities: []
    }));

    // 更新选中的产品
    if (selectedProduct && selectedProduct.type === record.type) {
      setSelectedProduct({
        ...selectedProduct,
        country: value,
        countryName: selectedCountry.countryName,
        state: '',
        stateName: '',
        city: '',
        cityName: ''
      });
    }
  }, [areaList, products, selectedProduct]);

  // 处理州/省变更
  const handleStateChange = (value: string) => {
    if (!selectedProduct) return;

    console.log('[DynamicBusiness] 选择州/省:', value);

    // 更新产品信息
    setSelectedProduct(prev => ({
      ...prev!,
      state: value
    }));

    // 获取选中的国家
    const selectedCountry = areaList
      .find(area => area.areaCode === selectedProduct.area)
      ?.countries.find(country => country.countryCode === selectedProduct.country);

    if (!selectedCountry) return;

    // 更新过滤选项
    const cities = selectedCountry.cities || [];
    setFilterOptions(prev => ({
      ...prev,
      cities: cities.map((city: DynamicProxyCity) => ({
        value: city.cityCode,
        label: city.cityName || '未知城市'
      }))
    }));
  };

  // 处理城市变更
  const handleCityChange = (value: string) => {
    if (!selectedProduct) return;

    console.log('[DynamicBusiness] 选择城市:', value);

    // 获取选中的国家
    const selectedCountry = areaList
      .find(area => area.areaCode === selectedProduct.area)
      ?.countries.find(country => country.countryCode === selectedProduct.country);

    if (!selectedCountry) return;

    // 获取选中的城市
    const selectedCity = selectedCountry.cities?.find(city => city.cityCode === value);
    if (!selectedCity) return;

    // 更新产品信息
    setSelectedProduct(prev => ({
      ...prev!,
      city: value
    }));
  };

  // 处理流量变更
  const handleFlowChange = (value: number | null) => {
    if (!selectedProduct) return;

    console.log('[DynamicBusiness] 修改流量:', {
      originalValue: value,
      productId: selectedProduct.id
    });

    // 更新产品信息
    setSelectedProduct(prev => ({
      ...prev!,
      flow: value === null ? undefined : value
    }));
  };

  // 修改区域数据加载函数
  const loadAreaList = useCallback(async (proxyType?: number, productNo?: string) => {
    if (!proxyType || !productNo) return;

    try {
      console.log('[DynamicBusiness] 开始加载区域列表:', { proxyType, productNo });
      const response = await request.get('/api/business/areas', {
        params: { proxyType, productNo }
      });

      if (response.data?.code === 0 && Array.isArray(response.data?.data)) {
        const areas = response.data.data.map((area: DynamicProxyArea) => {
          // 确保区域名称正确显示
          const areaName = AREA_NAME_MAP[area.areaCode] || area.areaName || '未知区域';
          console.log('[DynamicBusiness] 处理区域:', { 
            areaCode: area.areaCode, 
            mappedName: areaName,
            originalName: area.areaName,
            countriesCount: area.countries?.length || 0
          });

          return {
            areaCode: area.areaCode,
            areaName: areaName,
            countries: (area.countries || []).map((country: DynamicProxyCountry) => ({
              countryCode: country.countryCode,
              countryName: country.countryName,
              states: country.states || [],
              cities: country.cities || []
            }))
          };
        });

        console.log('[DynamicBusiness] 处理后的区域数据:', areas);
        setAreaList(areas);
        
        // 初始化过滤选项
        const initialFilterOptions: FilterOptions = {
          areas: areas.map((area: DynamicProxyArea) => ({
            value: area.areaCode,
            label: area.areaName
          })),
          countries: [],
          states: [],
          cities: []
        };
        
        console.log('[DynamicBusiness] 初始过滤选项:', initialFilterOptions);
        setFilterOptions(initialFilterOptions);
      }
    } catch (error) {
      console.error('[DynamicBusiness] 加载区域列表失败:', error);
      setAreaList([]);
    }
  }, []);

  // 修改 computedFilterOptions 函数
  const computedFilterOptions = useMemo(() => {
    const options: FilterOptions = {
      areas: [],
      countries: [],
      states: [],
      cities: []
    };

    // 处理区域列表
    const processAreas = () => {
      options.areas = areaList.map((area: DynamicProxyArea) => ({
        value: area.areaCode,
        label: AREA_NAME_MAP[area.areaCode] || area.areaName || '未知区域'
      }));
    };

    // 处理国家列表
    const processCountries = (selectedAreaData: DynamicProxyArea) => {
      options.countries = selectedAreaData.countries.map((country: DynamicProxyCountry) => ({
        value: country.countryCode,
        label: country.countryName || '未知国家'
      }));
    };

    // 处理州/省列表
    const processStates = (selectedCountry: DynamicProxyCountry) => {
      options.states = selectedCountry.states.map((state: DynamicProxyState) => ({
        value: state.code,
        label: state.name || '未知州/省'
      }));
    };

    // 处理城市列表
    const processCities = (country: DynamicProxyCountry) => {
      if (country.cities && Array.isArray(country.cities)) {
        const validCities = country.cities.filter((city): city is DynamicProxyCity => {
          return city && typeof city === 'object' && 'cityCode' in city && Boolean(city.cityCode);
        });
        
        options.cities = validCities.map((city) => ({
          value: city.cityCode,
          label: city.cityName || '未知城市'
        }));
      }
    };

    // 主处理逻辑
    processAreas();

    if (selectedProduct?.area) {
      const selectedAreaData = areaList.find((area: DynamicProxyArea) => area.areaCode === selectedProduct.area);
      if (selectedAreaData) {
        processCountries(selectedAreaData);

        if (selectedProduct.country) {
          const selectedCountry = selectedAreaData.countries.find(
            (country: DynamicProxyCountry) => country.countryCode === selectedProduct.country
          );
          if (selectedCountry) {
            processStates(selectedCountry);

            if (selectedProduct.state) {
              processCities(selectedCountry);
            }
          }
        }
      }
    }

    return options;
  }, [areaList, selectedProduct]);

  // 使用 useEffect 监听选中产品的变化
  useEffect(() => {
    if (selectedProduct?.proxyType && selectedProduct?.type) {
      loadAreaList(selectedProduct.proxyType, selectedProduct.type);
    }
  }, [selectedProduct, loadAreaList]);

  // 修改表格列定义
  const columns = useMemo(() => {
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
        width: 520,
        render: (_: any, record: ProductPrice) => {
          const isAreaSelected = Boolean(record.area);
          const isCountrySelected = Boolean(record.country);
          const isStateSelected = Boolean(record.state);

          return (
            <Space style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>区域</span>
                <Select
                  style={{ width: '120px' }}
                  value={record.area}
                  onChange={(value: string) => handleAreaChange(value, record)}
                  placeholder="请选择区域"
                  options={computedFilterOptions.areas}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>国家</span>
                <Select
                  style={{ width: '120px' }}
                  value={record.country}
                  onChange={(value: string) => handleCountryChange(value, record)}
                  placeholder="请选择国家"
                  disabled={!isAreaSelected}
                  options={computedFilterOptions.countries}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>州/省</span>
                <Select
                  style={{ width: '120px' }}
                  value={record.state}
                  onChange={handleStateChange}
                  placeholder="请选择州/省"
                  disabled={!isCountrySelected}
                  options={computedFilterOptions.states}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>城市</span>
                <Select
                  style={{ width: '120px' }}
                  value={record.city}
                  onChange={handleCityChange}
                  placeholder="请选择城市"
                  disabled={!isStateSelected}
                  options={computedFilterOptions.cities}
                />
              </div>
            </Space>
          );
        }
      },
      {
        title: '流量(GB)',
        dataIndex: 'flow',
        key: 'flow',
        width: 120,
        render: (_, record) => (
          <InputNumber
            min={1}
            max={1000}
            value={record.flow}
            onChange={(value) => {
              console.log('[DynamicBusiness] 流量输入变更:', {
                originalValue: value,
                recordId: record.id
              });
              handleFlowChange(value);
            }}
            placeholder="请输入流量"
            style={{ width: '100%' }}
            precision={0}
            step={1}
            controls={true}
            parser={(value) => {
              if (!value) return 0;
              const parsed = parseInt(value, 10);
              console.log('[DynamicBusiness] 流量输入解析:', {
                input: value,
                parsed: parsed
              });
              return isNaN(parsed) ? 0 : parsed;
            }}
            formatter={(value) => {
              if (!value && value !== 0) return '';
              return value.toString();
            }}
          />
        )
      },
      {
        title: '单价',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        render: (price: number) => {
          const validPrice = typeof price === 'number' && price > 0 ? price : 0;
          return `¥${validPrice.toFixed(2)}/GB`;
        }
      },
      {
        title: '总价',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        width: 120,
        render: (_: any, record: ProductPrice) => {
          const flow = record.flow || 0;
          const price = typeof record.price === 'number' ? record.price : 0;
          const totalPrice = (flow * price / 1000).toFixed(2); // 将MB转换为GB
          return `¥${totalPrice}`;
        }
      }
    ];
  }, [products, computedFilterOptions, handleAreaChange, handleCountryChange, handleStateChange, handleCityChange, handleFlowChange]);

  // 在加载产品列表后调用获取区域列表
  useEffect(() => {
    if (products.length > 0) {
      const firstProduct = products[0];
      loadAreaList(104, firstProduct.type);
    }
  }, [products, loadAreaList]);

  return (
    <PageContainer>
      <Card className={styles.dynamicBusinessPage}>
        <Alert
          message="业务说明"
          description={
            <>
              <p>1. 动态代理按流量计费，最小购买单位为1000MB（1GB=1000MB）</p>
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
              {displayedUrl && (
                <div style={{ marginTop: '16px' }}>
                  <Typography.Paragraph copyable={{ text: displayedUrl }}>
                    {displayedUrl}
                  </Typography.Paragraph>
                  <Space>
                    <Button onClick={() => navigator.clipboard.writeText(displayedUrl)}>
                      拷贝链接
                    </Button>
                    <Button onClick={() => window.open(displayedUrl, '_blank')}>
                      打开链接
                    </Button>
                  </Space>
                </div>
              )}
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
          <Alert
            message="提取成功"
            description={
              <div>
                <Typography.Paragraph>
                  {extractConfig.method === ExtractMethod.PASSWORD ? '代理地址列表：' : 'API地址：'}
                </Typography.Paragraph>
                <Typography.Paragraph copyable style={{ whiteSpace: 'pre-wrap' }}>
                  {extractedUrl}
                </Typography.Paragraph>
                {extractConfig.method === ExtractMethod.PASSWORD && (
                  <Typography.Text type="secondary">
                    注意：代理地址有效期为 {extractConfig.validTime} 分钟
                  </Typography.Text>
                )}
              </div>
            }
            type="success"
            showIcon
          />
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