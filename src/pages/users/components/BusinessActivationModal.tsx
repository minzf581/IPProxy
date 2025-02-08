import React, { useState, useEffect } from 'react';
import { Modal, Form, Radio, Input, Row, Col, Button, message, Select, InputNumber, Space, Statistic } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { api } from '@/utils/request';
import { API_PREFIX, API_ROUTES } from '@/shared/routes';
import styles from './BusinessActivationModal.module.less';
import type { User } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { getResourcePrices, PriceSettings } from '@/services/settingsService';
import { ipProxyAPI } from '@/utils/ipProxyAPI';
import type { Area, Country, City, IpRange, StaticType } from '@/types/api';
import type { AreaResponse } from '@/utils/ipProxyAPI';
import { createOrder } from '@/services/orderService';

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

export interface BusinessActivationModalProps {
  visible: boolean;
  user: {
    id: number;
    username: string;
    agent_id?: number;
    agent_username?: string;
    status: string;
    balance: number;
    email?: string;
    is_agent: boolean;
    created_at: string;
    updated_at: string;
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

interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
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
  const [cities, setCities] = useState<City[]>([]);
  const [staticTypes, setStaticTypes] = useState<StaticType[]>([]);
  const [ipRanges, setIpRanges] = useState<DisplayIpRange[]>([]);
  const [regionStock, setRegionStock] = useState<number>(0);
  const [selectedIpRange, setSelectedIpRange] = useState<DisplayIpRange | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setLoadingMessage('正在加载初始数据...');
      
      // 获取价格配置
      const pricesResponse = await getResourcePrices(Number(user.agent_id));
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
      const citiesData = await ipProxyAPI.getCitiesByCountry(countryCode);
      setCities(citiesData);
      form.setFieldsValue({ city: undefined });
    } catch (error) {
      console.error('加载城市数据失败:', error);
      message.error('加载城市数据失败');
    }
  };

  // 加载IP段列表
  const loadIpRanges = async (values: any) => {
    try {
      setLoading(true);
      console.log('[BusinessActivationModal] 开始加载IP段, 参数:', values);
      
      const params = {
        proxyType: 103,  // 静态国外家庭代理
        regionCode: values.region,
        countryCode: values.country,
        cityCode: values.city,
        staticType: values.staticType
      };
      
      const response = await ipProxyAPI.getIpRanges(params);
      console.log('[BusinessActivationModal] IP段加载结果:', response);
      
      if (!response || response.length === 0) {
        message.warning('未找到符合条件的IP段');
        setIpRanges([]);
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
      message.error('加载IP段失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setIpRanges([]);
    } finally {
      setLoading(false);
    }
  };

  // 计算总费用
  const calculateTotalCost = async (values: FormValues): Promise<number> => {
    try {
      if (values.proxyType === 'dynamic') {
        // 验证必要参数
        if (!values.poolType) {
          message.error('请选择代理池类型');
          setTotalCost(0);
          return 0;
        }
        
        // 确保流量值为数字
        const trafficAmount = Number(values.traffic);
        console.log('[calculateTotalCost] 处理流量参数:', {
          original: values.traffic,
          converted: trafficAmount,
          type: typeof trafficAmount
        });

        if (isNaN(trafficAmount) || trafficAmount <= 0) {
          message.error('请输入有效的流量值');
          setTotalCost(0);
          return 0;
        }

        // 直接使用价格配置计算
        if (!prices?.dynamic) {
          message.error('价格配置未加载');
          setTotalCost(0);
          return 0;
        }

        const unitPrice = prices.dynamic[values.poolType] || 0;
        const total = unitPrice * trafficAmount;
        
        console.log('[calculateTotalCost] 动态代理价格计算:', {
          unitPrice,
          trafficAmount,
          total
        });
        
        setTotalCost(total);
        return total;

      } else {
        // 静态代理价格计算
        if (!prices?.static) {
          message.error('价格配置未加载');
          setTotalCost(0);
          return 0;
        }

        const basePrice = prices.static[values.staticType || 'residential'] || 0;
        const quantity = Number(values.quantity) || 0;
        const duration = Number(values.duration) || 0;
        const total = basePrice * quantity * duration;
        
        console.log('[calculateTotalCost] 静态代理价格计算:', {
          basePrice,
          quantity,
          duration,
          total
        });
        
        setTotalCost(total);
        return total;
      }
    } catch (error) {
      console.error('[calculateTotalCost] 计算价格失败:', error);
      message.error('计算价格时发生错误，请稍后重试');
      setTotalCost(0);
      return 0;
    }
  };

  // 处理表单值变化
  const handleValuesChange = async (changedValues: any, allValues: any) => {
    console.log('[handleValuesChange] 表单值变化:', {
      changed: changedValues,
      all: allValues
    });

    // 如果改变了影响价格的字段，重新计算价格
    if ('proxyType' in changedValues || 
        'poolType' in changedValues || 
        'traffic' in changedValues ||
        'staticType' in changedValues ||
        'quantity' in changedValues ||
        'duration' in changedValues) {
      await calculateTotalCost(allValues);
    }

    // 处理级联选择
    if ('region' in changedValues) {
      console.log('[handleValuesChange] 区域变化:', changedValues.region);
      handleRegionChange(changedValues.region);
    }
    if ('country' in changedValues) {
      console.log('[handleValuesChange] 国家变化:', changedValues.country);
      handleCountryChange(changedValues.country);
    }

    // 检查是否需要加载IP段列表
    const { region, country, staticType } = allValues;
    if (region && country && staticType) {
      console.log('[handleValuesChange] 加载IP段列表条件满足:', {
        region,
        country,
        staticType
      });
      loadIpRanges(allValues);
    }
  };

  const handleProxyTypeChange = (e: RadioChangeEvent) => {
    setProxyType(e.target.value);
    form.resetFields(['poolType', 'traffic', 'region', 'country', 'city', 'staticType', 'ipRange', 'duration', 'quantity', 'remark']);
  };

  // 修改handleSubmit函数
  const handleSubmit = async (values: FormValues) => {
    try {
      debug.log('[BusinessActivationModal] 开始处理表单提交:', values);
      
      // 计算总成本
      const totalCost = await calculateTotalCost(values);
      
      // 准备订单数据
      const orderData: CreateOrderParams = {
        orderType: values.proxyType === 'dynamic' ? 'dynamic_proxy' : 'static_proxy',
        poolId: values.poolType || 'pool1',
        trafficAmount: values.proxyType === 'dynamic' ? Number(values.traffic) : undefined,
        unitPrice: prices?.dynamic[values.poolType || ''] || 0,
        totalAmount: totalCost,
        remark: values.remark,
        userId: user.id  // 添加用户ID
      };

      debug.log('[BusinessActivationModal] 提交订单数据:', orderData);
      
      // 创建订单
      const response = await createOrder(orderData);
      
      if (response.code === 0) {
        message.success('订单创建成功');
        onSuccess();
      } else {
        throw new Error(response.msg || '订单创建失败');
      }
    } catch (error: any) {
      debug.error('[BusinessActivationModal] 订单提交失败:', error);
      debug.error('[BusinessActivationModal] 错误详情:', {
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
        <div className={styles.priceInfo}>
          单价：{prices.dynamic[poolType] || 0}元/m
        </div>
      );
    }
    const staticType = form.getFieldValue('staticType');
    return (
      <div className={styles.priceInfo}>
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
  const renderCitySelector = () => (
    <Form.Item
      name="city"
      label="城市"
      rules={[{ required: true, message: '请选择城市' }]}
    >
      <Select
        placeholder="请选择城市"
        loading={loading}
        disabled={!form.getFieldValue('country')}
      >
        {cities.map((city, index) => (
          city.cityCode ? (
            <Option 
              key={city.cityCode} 
              value={city.cityCode}
            >
              {city.cityName}
            </Option>
          ) : null
        )).filter(Boolean)}
      </Select>
    </Form.Item>
  );

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