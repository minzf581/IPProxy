import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Radio, message, InputNumber, Row, Col, Button, Space, Statistic } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { ipProxyAPI } from '@/utils/ipProxyAPI';
import type { AreaResponse } from '@/utils/ipProxyAPI';
import { createOrder } from '@/services/orderService';
import type { ApiResponse, Area, Country, StaticType, IpRange } from '@/types/api';
import { getResourcePrices, type PriceSettings } from '@/services/settingsService';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/request';

const { TextArea } = Input;
const { Option } = Select;

// 添加 debug 工具
const debug = {
  log: (...args: any[]) => {
    console.log('[BusinessActivationModal]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[BusinessActivationModal]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[BusinessActivationModal]', ...args);
  }
};

interface CityData {
  cityCode: string;
  cityName: string;
  countryCode: string;
}

interface ProcessedCity {
  code: string;
  name: string;
  cname: string;
  countryCode: string;
}

interface BusinessActivationModalProps {
  visible: boolean;
  user: {
    id: number;
    username: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

interface OrderData {
  userId: string;
  username: string;
  proxyType: 'dynamic' | 'static';
  poolType?: string;
  traffic?: string;
  region?: string;
  country?: string;
  city?: string;
  staticType?: string;
  ipRange?: string;
  duration?: number;
  quantity?: string;
  remark?: string;
  agentId: string;
  agentUsername: string;
  total_cost: number;
}

interface FormValues {
  proxyType: 'dynamic' | 'static';
  poolType?: string;
  traffic?: string;
  region?: string;
  country?: string;
  city?: string;
  staticType?: string;
  ipRange?: string;
  duration?: number;
  quantity?: string;
  remark?: string;
}

// 预设的静态类型
const STATIC_TYPES: StaticType[] = [
  { code: '1', name: '纯净静态1', price: 100 },
  { code: '2', name: '纯净静态2', price: 120 },
  { code: '3', name: '纯净静态3', price: 140 },
  { code: '4', name: '纯净静态4', price: 160 },
  { code: '5', name: '纯净静态5', price: 180 },
  { code: '7', name: '纯净静态7', price: 200 }
];

interface DisplayIpRange {
  ipStart: string;
  ipEnd: string;
  ipCount: number;
  stock: number;
  staticType: string;
  countryCode: string;
  cityCode: string;
  regionCode: string;
  price: number;
  status: number;
}

// 定义价格类型
interface PriceConfig {
  dynamic: {
    [key: string]: number;
    pool1: number;
    pool2: number;
  };
  static: {
    [key: string]: number;
    residential: number;
    datacenter: number;
  };
}

// 在文件顶部添加类型定义
interface CreateOrderParams {
  orderType: 'dynamic_proxy' | 'static_proxy';
  poolId: string;
  trafficAmount?: number;
  unitPrice: number;
  totalAmount: number;
  remark?: string;
  userId: number;
  ipCount?: number;
  duration?: number;
  staticType?: string;
  regionCode?: string;
  countryCode?: string;
  cityCode?: string;
}

const BusinessActivationModal: React.FC<BusinessActivationModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [proxyType, setProxyType] = useState<'dynamic' | 'static'>('dynamic');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [hasInput, setHasInput] = useState(false);
  const [prices, setPrices] = useState<PriceSettings | null>(null);
  const { user: currentUser } = useAuth();

  // 新增状态
  const [regions, setRegions] = useState<Area[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<ProcessedCity[]>([]);
  const [staticTypes, setStaticTypes] = useState<StaticType[]>([]);
  const [ipRanges, setIpRanges] = useState<IpRange[]>([]);
  const [regionStock, setRegionStock] = useState<number>(0);
  const [selectedIpRange, setSelectedIpRange] = useState<DisplayIpRange | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setLoadingMessage('正在加载初始数据...');
      
      // 获取价格配置
      if (!currentUser?.id) {
        message.error('获取用户信息失败');
        return;
      }
      const pricesResponse = await getResourcePrices(currentUser.id);
      setPrices(pricesResponse);
      
      // 获取区域列表
      const areasResponse = await ipProxyAPI.getAreaList();
      if (areasResponse && areasResponse.length > 0) {
        const convertedAreas = areasResponse.map(convertAreaResponseToArea);
        setRegions(convertedAreas);
      }
      
      // 同步库存
      await syncInventory();
      
    } catch (error) {
      console.error('加载初始数据失败:', error);
      message.error('加载初始数据失败');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  // 同步库存信息
  const syncInventory = async () => {
    try {
      const response = await api.post('/proxy/inventory/sync');

      if (response.data?.code === 0) {
        console.log('[syncInventory] 库存同步成功');
      } else {
        console.error('[syncInventory] 同步失败:', response.data);
      }
    } catch (error: any) {
      console.error('[syncInventory] 同步库存失败:', error);
      if (error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.msg || error.message;
        
        switch (status) {
          case 401:
            message.error('登录已过期，请重新登录');
            break;
          case 403:
            message.error('没有权限执行此操作');
            break;
          case 500:
            message.error(`服务器错误: ${errorMsg}`);
            break;
          default:
            message.error(`同步库存失败: ${errorMsg}`);
        }
      } else if (error.request) {
        message.error('网络请求失败，请检查网络连接');
      } else {
        message.error('同步库存失败，请稍后重试');
      }
    }
  };

  // 类型转换函数
  const convertAreaResponseToArea = (response: AreaResponse): Area => ({
    areaCode: response.code,
    areaName: response.name || response.cname,
    countryList: response.children?.map((child: AreaResponse) => ({
      countryCode: child.code,
      countryName: child.name || child.cname,
      cityList: []
    })) || []
  });

  // 类型转换函数 - 国家列表
  const convertAreaResponseToCountry = (response: AreaResponse): Country => ({
    countryCode: response.code,
    countryName: response.name || response.cname,
    cityList: []
  });

  // 在 useEffect 中初始化静态类型
  useEffect(() => {
    if (visible) {
      setStaticTypes(STATIC_TYPES);
    }
  }, [visible]);

  // 处理区域变化
  const handleRegionChange = async (areaCode: string) => {
    if (!areaCode) {
      console.warn('[handleRegionChange] 无效的区域代码');
      return;
    }

    console.log('[handleRegionChange] 开始处理区域变化:', areaCode);
    
    try {
      const countriesData = await ipProxyAPI.getCountriesByRegion(areaCode);

      console.log('[handleRegionChange] 获取数据成功:', {
        countries: countriesData
      });

      setCountries(countriesData.map(convertAreaResponseToCountry));
      
      // 重置相关字段
      form.setFieldsValue({ 
        country: undefined, 
        city: undefined,
        staticType: undefined,
        ipRange: undefined
      });
      
      setCities([]);
      setIpRanges([]);
    } catch (error) {
      console.error('[handleRegionChange] 加载区域数据失败:', error);
      message.error('加载区域数据失败');
    }
  };

  // 处理国家变化
  const handleCountryChange = async (countryCode: string) => {
    try {
      console.log('[BusinessActivationModal] 开始获取城市列表，国家代码:', countryCode);
      const response = await ipProxyAPI.getCitiesByCountry(countryCode);
      console.log('[BusinessActivationModal] 城市列表响应:', response);
      
      // 检查响应是否是数组（直接返回的城市列表）
      const cityData = Array.isArray(response) ? response : 
                      response.data && Array.isArray(response.data) ? response.data : 
                      null;
      
      if (cityData) {
        console.log('[BusinessActivationModal] 处理城市数据:', cityData);
        const cityList: ProcessedCity[] = cityData.map(city => ({
          code: city.cityCode,
          name: city.cityName,
          cname: city.cityName,
          countryCode: city.countryCode || countryCode // 使用传入的countryCode作为后备
        }));
        console.log('[BusinessActivationModal] 处理后的城市列表:', cityList);
        setCities(cityList);
        // 清空已选择的城市
        form.setFieldsValue({ city: undefined });
      } else {
        console.warn('[BusinessActivationModal] 无效的城市数据:', response);
        message.error('获取城市列表失败');
      }
    } catch (error) {
      console.error('[BusinessActivationModal] 获取城市列表错误:', error);
      message.error('获取城市列表失败');
    }
  };

  // 加载IP段列表
  const loadIpRanges = async (values: any) => {
    try {
      setLoading(true);
      console.log('[BusinessActivationModal] 开始加载IP段, 参数:', values);
      
      // 根据 proxyType 设置正确的类型值
      let proxyTypeValue = 103; // 默认静态国外家庭代理
      if (values.proxyType === 'static') {
        proxyTypeValue = 103;
      } else if (values.proxyType === 'dynamic') {
        proxyTypeValue = 104;
      }
      
      const params = {
        proxyType: proxyTypeValue,
        regionCode: values.region,
        countryCode: values.country,
        cityCode: values.city,
        staticType: values.staticType
      };
      
      const response = await ipProxyAPI.getIpRanges(params);
      console.log('[BusinessActivationModal] IP段加载结果:', response);
      
      // 如果响应为空或没有数据，使用默认的 ALL 选项
      if (!response || response.length === 0) {
        console.log('[BusinessActivationModal] 使用默认 ALL 选项');
        const defaultRange: DisplayIpRange = {
          ipStart: 'ALL',
          ipEnd: 'ALL',
          ipCount: 0,
          stock: 999999,
          staticType: values.staticType || '1',
          countryCode: values.country,
          cityCode: values.city,
          regionCode: values.region,
          price: 0,
          status: 1
        };
        setIpRanges([defaultRange]);
        return;
      }
      
      // 转换为DisplayIpRange类型
      const displayRanges: DisplayIpRange[] = response.map(range => ({
        ipStart: range.ipStart,
        ipEnd: range.ipEnd,
        ipCount: range.ipCount,
        stock: range.stock,
        staticType: range.staticType,
        countryCode: range.countryCode,
        cityCode: range.cityCode,
        regionCode: range.regionCode,
        price: range.price,
        status: range.status
      }));
      
      setIpRanges(displayRanges);
    } catch (error) {
      console.error('[BusinessActivationModal] 加载IP段失败:', error);
      message.error('加载IP段失败');
      setIpRanges([]);
    } finally {
      setLoading(false);
    }
  };

  // 计算总费用
  const calculateTotalCost = async (values: FormValues): Promise<number> => {
    console.log('计算总价，参数:', values);
    
    if (!values.proxyType) {
      console.warn('未选择代理类型');
      return 0;
    }

    if (values.proxyType === 'dynamic') {
      // 动态代理价格计算逻辑保持不变
      if (!values.poolType || !values.traffic) {
        console.warn('动态代理缺少必要参数');
        return 0;
      }
      const unitPrice = prices?.dynamic[values.poolType] || 0;
      return unitPrice * Number(values.traffic);
    } else {
      // 静态代理价格计算逻辑
      if (!values.quantity || !values.duration || !values.ipRange) {
        console.warn('静态代理缺少必要参数');
        return 0;
      }

      // 从选中的IP段中获取价格
      const selectedIpRange = ipRanges.find(range => 
        range.ipStart === values.ipRange?.split('-')[0] && 
        range.ipEnd === values.ipRange?.split('-')[1]
      );

      // 如果找到IP段的价格就使用它，否则使用默认价格（2元/ip/天）
      const unitPrice = selectedIpRange?.price || 2;
      console.log('静态代理单价:', unitPrice, '元/ip/天');

      const quantity = Number(values.quantity);
      const duration = Number(values.duration);
      const totalCost = unitPrice * quantity * duration;

      console.log('静态代理总价计算:', {
        unitPrice,
        quantity,
        duration,
        totalCost
      });

      return totalCost;
    }
  };

  // 处理表单值变化
  const handleValuesChange = async (changedValues: any, allValues: any) => {
    console.log('[handleValuesChange] Changed values:', changedValues);
    console.log('[handleValuesChange] All values:', allValues);

    // 如果改变了代理类型，重置相关字段
    if ('proxyType' in changedValues) {
      form.setFieldsValue({
        poolType: undefined,
        traffic: undefined,
        region: undefined,
        country: undefined,
        city: undefined,
        staticType: undefined,
        ipRange: undefined,
        duration: undefined,
        quantity: undefined,
      });
      setTotalCost(0);
      return;
    }

    // 如果改变了数量、时长或其他可能影响总价的字段，重新计算总价
    if (
      'quantity' in changedValues || 
      'duration' in changedValues || 
      'traffic' in changedValues ||
      'staticType' in changedValues ||
      'poolType' in changedValues
    ) {
      const total = await calculateTotalCost(allValues);
      setTotalCost(total);
    }

    // 如果改变了区域，加载国家列表
    if ('region' in changedValues) {
      await handleRegionChange(changedValues.region);
    }

    // 如果改变了国家，加载城市列表
    if ('country' in changedValues) {
      await handleCountryChange(changedValues.country);
    }

    // 如果改变了城市或静态类型，加载IP段列表
    if ('city' in changedValues || 'staticType' in changedValues) {
      await loadIpRanges(allValues);
    }
  };

  const handleProxyTypeChange = (e: RadioChangeEvent) => {
    setProxyType(e.target.value);
    form.resetFields(['poolType', 'traffic', 'region', 'country', 'city', 'staticType', 'ipRange', 'duration', 'quantity', 'remark']);
  };

  // 修改handleSubmit函数
  const handleSubmit = async (values: FormValues) => {
    try {
      console.log('开始处理表单提交:', values);
      
      // 计算总成本
      const totalCost = await calculateTotalCost(values);
      
      if (totalCost <= 0) {
        message.error('订单金额必须大于0');
        return;
      }

      // 获取选中的IP段信息
      const selectedIpRange = values.proxyType === 'static' ? ipRanges.find(range => 
        `${range.ipStart}-${range.ipEnd}` === values.ipRange
      ) : null;

      // 准备订单数据
      const orderData: CreateOrderParams = {
        orderType: values.proxyType === 'dynamic' ? 'dynamic_proxy' : 'static_proxy',
        poolId: values.proxyType === 'dynamic' ? 
          (values.poolType || 'pool1') : 
          (values.ipRange?.split('-')[0] || 'ALL'),
        trafficAmount: values.proxyType === 'dynamic' ? Number(values.traffic) : undefined,
        unitPrice: values.proxyType === 'dynamic' ? 
          (prices?.dynamic[values.poolType || ''] || 0) :
          (selectedIpRange?.price || 2), // 使用IP段的价格或默认价格
        totalAmount: totalCost,
        remark: values.remark,
        userId: user.id,
        // 添加静态代理特有参数
        ...(values.proxyType === 'static' && {
          ipCount: Number(values.quantity) || 1,
          duration: Number(values.duration) || 30,
          staticType: selectedIpRange?.staticType || values.staticType,
          regionCode: values.region,
          countryCode: values.country,
          cityCode: values.city
        })
      };

      console.log('提交订单数据:', orderData);
      
      // 创建订单
      const response = await createOrder(orderData);
      
      if (response.code === 0) {
        message.success('订单创建成功');
        onSuccess();
      } else {
        throw new Error(response.msg || '订单创建失败');
      }
    } catch (error: any) {
      console.error('订单提交失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        config: error.config
      });
      message.error(error.response?.data?.message || error.message || '订单创建失败');
    }
  };

  const handleDeactivate = async (orderNo: string, proxyType: 'dynamic' | 'static') => {
    try {
      setLoading(true);
      
      const response = await api.post(`/api/user/${user.id}/deactivate-business`, {
        orderNo,
        proxyType
      });
      
      if (response.data.code === 200) {
        message.success('资源释放成功');
        onSuccess();
      } else {
        message.error(response.data.message || '资源释放失败');
      }
    } catch (error) {
      console.error('释放资源失败:', error);
      message.error('释放资源失败');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderActions = (order: any) => (
    <Space>
      <Button 
        type="primary" 
        danger
        onClick={() => handleDeactivate(order.orderNo, order.proxyType)}
        loading={loading}
      >
        释放资源
      </Button>
    </Space>
  );

  // 渲染价格信息
  const renderPriceInfo = () => {
    if (!prices) return null;
    
    if (proxyType === 'dynamic') {
      const poolType = form.getFieldValue('poolType');
      return (
        <div style={{ marginBottom: 20 }}>
          单价：{prices.dynamic[poolType] || 0}元/m
        </div>
      );
    }
    const staticType = form.getFieldValue('staticType');
    return (
      <div style={{ marginBottom: 20 }}>
        单价：{prices.static[staticType] || prices.static.residential}元/IP/天
      </div>
    );
  };

  // 渲染区域选择器
  const renderRegionSelector = () => (
    <Form.Item
      name="region"
      label="区域"
      rules={[{ required: true, message: '请选择区域' }]}
    >
      <Select
        placeholder="请选择区域"
        onChange={handleRegionChange}
        loading={loading}
      >
        {regions.map((region, index) => (
          region.areaCode ? (
            <Option 
              key={region.areaCode} 
              value={region.areaCode}
            >
              {region.areaName}
            </Option>
          ) : null
        )).filter(Boolean)}
      </Select>
    </Form.Item>
  );

  // 渲染国家选择器
  const renderCountrySelector = () => (
    <Form.Item
      name="country"
      label="国家"
      rules={[{ required: true, message: '请选择国家' }]}
    >
      <Select
        placeholder="请选择国家"
        onChange={handleCountryChange}
        loading={loading}
        disabled={!form.getFieldValue('region')}
      >
        {countries.map((country, index) => (
          country.countryCode ? (
            <Option 
              key={country.countryCode} 
              value={country.countryCode}
            >
              {country.countryName}
            </Option>
          ) : null
        )).filter(Boolean)}
      </Select>
    </Form.Item>
  );

  // 渲染城市选择器
  const renderCitySelector = () => {
    console.log('[BusinessActivationModal] 渲染城市选择器');
    console.log('[BusinessActivationModal] 当前城市列表:', cities);
    console.log('[BusinessActivationModal] 表单当前值:', form.getFieldsValue());
    
    return (
      <Form.Item
        name="city"
        label="城市"
        rules={[{ required: true, message: '请选择城市' }]}
      >
        <Select
          placeholder="请选择城市"
          onChange={(value) => {
            console.log('[BusinessActivationModal] 城市选择变更:', value);
            form.setFieldsValue({ city: value });
          }}
          disabled={!form.getFieldValue('country')}
          loading={loading}
          showSearch
          optionFilterProp="children"
        >
          {cities.map(city => (
            <Select.Option key={city.code} value={city.code}>
              {city.cname || city.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
  };

  // 渲染静态类型选择器
  const renderStaticTypeSelector = () => (
    <Form.Item
      name="staticType"
      label="纯净静态名称"
      rules={[{ required: true, message: '请选择纯净静态名称' }]}
    >
      <Select placeholder="请选择纯净静态名称">
        {STATIC_TYPES.map(type => (
          <Option key={type.code} value={type.code}>
            {type.name}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );

  // 渲染IP段选择器
  const renderIpRangeSelector = () => (
    <Form.Item
      label="IP段"
      name="ipRange"
      rules={[{ required: true, message: '请选择IP段' }]}
    >
      <Select
        placeholder="请选择IP段"
        loading={loading}
        onChange={(value) => {
          const selectedRange = ipRanges.find(range => 
            `${range.ipStart}-${range.ipEnd}` === value
          );
          if (selectedRange) {
            setSelectedIpRange(selectedRange);
            form.setFieldsValue({
              quantity: Math.min(selectedRange.stock, 10000).toString()
            });
          }
        }}
      >
        {ipRanges.map((range) => {
          const key = `${range.ipStart}-${range.ipEnd}`;
          const label = `${range.ipStart} - ${range.ipEnd} (可用: ${range.stock}个, 价格: ${range.price}元/IP/天)`;
          return (
            <Select.Option 
              key={key} 
              value={key}
              disabled={range.stock <= 0 || range.status !== 1}
            >
              {label}
            </Select.Option>
          );
        })}
      </Select>
    </Form.Item>
  );

  return (
    <Modal
      title="业务开通"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          支付
        </Button>
      ]}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        initialValues={{
          proxyType: 'dynamic'
        }}
      >
        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="proxyType"
              label="代理类型"
              initialValue="dynamic"
              rules={[{ required: true, message: '请选择代理类型' }]}
            >
              <Radio.Group onChange={handleProxyTypeChange}>
                <Radio value="dynamic">动态代理</Radio>
                <Radio value="static">静态代理</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {proxyType === 'dynamic' && (
          <>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="poolType"
                  label="IP池选择"
                  rules={[{ required: true, message: '请选择IP池' }]}
                >
                  <Radio.Group>
                    <Radio value="pool1">动态IP池1</Radio>
                    <Radio value="pool2">动态IP池2</Radio>
                    <Radio value="pool3">动态IP池3</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="traffic"
                  label="流量每/m"
                  rules={[
                    { required: true, message: '请输入流量数量' },
                    { 
                      validator: async (_, value) => {
                        const num = Number(value);
                        if (isNaN(num) || num <= 0) {
                          throw new Error('请输入大于0的数字');
                        }
                      }
                    }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="1000m=1Gb"
                    min={1}
                    precision={0}
                    parser={(value) => {
                      const parsed = parseInt(value || '0', 10);
                      return isNaN(parsed) ? 0 : parsed;
                    }}
                    formatter={(value) => `${value}`}
                    onChange={(value) => {
                      console.log('[traffic onChange] 流量值变化:', {
                        value,
                        type: typeof value,
                        parsed: Number(value)
                      });
                      form.setFieldValue('traffic', value);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="remark"
                  label="备注"
                >
                  <Input.TextArea placeholder="请输入备注（仅显示在订单管理中）" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Statistic title="剩余额度" value={currentUser?.balance || 0} prefix="¥" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="总计费用" value={totalCost} prefix="¥" precision={2} />
              </Col>
            </Row>
          </>
        )}

        {proxyType === 'static' && (
          <>
            <Row gutter={24}>
              <Col span={12}>
                {renderRegionSelector()}
              </Col>
              <Col span={12}>
                {renderCountrySelector()}
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                {renderCitySelector()}
              </Col>
              <Col span={12}>
                {renderStaticTypeSelector()}
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                {renderIpRangeSelector()}
              </Col>
              <Col span={12}>
                <Form.Item
                  name="duration"
                  label="代理时长"
                  rules={[{ required: true, message: '请选择代理时长' }]}
                >
                  <Select placeholder="请选择代理时长">
                    <Option key="1" value={1}>1个月</Option>
                    <Option key="3" value={3}>3个月</Option>
                    <Option key="6" value={6}>6个月</Option>
                    <Option key="12" value={12}>12个月</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="代理数量"
                  rules={[
                    { required: true, message: '请输入代理数量' },
                    { type: 'number', min: 1, max: 10000, message: '数量范围为1-10000' }
                  ]}
                  extra={selectedIpRange ? `最大可购买数量: ${Math.min(10000, selectedIpRange.stock)}个` : ''}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={selectedIpRange ? Math.min(10000, selectedIpRange.stock) : 10000}
                    placeholder="请输入代理数量(1-10000)"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="remark"
                  label="备注"
                >
                  <TextArea placeholder="请输入备注（仅显示在订单管理中）" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Statistic title="剩余额度" value={currentUser?.balance || 0} prefix="¥" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="总计费用" value={totalCost} prefix="¥" precision={2} />
              </Col>
            </Row>
          </>
        )}

        <Row gutter={24}>
          <Col span={24}>
            {renderPriceInfo()}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default BusinessActivationModal; 