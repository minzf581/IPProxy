import React, { useState, useEffect } from 'react';
import { Modal, Form, Radio, Input, Row, Col, Button, message, Select, InputNumber, Space, Statistic } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { api } from '@/utils/request';
import styles from './BusinessActivationModal.module.less';
import type { User } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { getResourcePrices, ResourcePrices } from '@/services/settingsService';
import { ipProxyAPI } from '@/utils/ipProxyAPI';
import type { Area, Country, City, IpRange, StaticType } from '@/types/api';
import type { AreaResponse } from '@/utils/ipProxyAPI';

const { TextArea } = Input;
const { Option } = Select;

export interface BusinessActivationModalProps {
  visible: boolean;
  user: User;
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
  range: string;
  stock: number;
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

const BusinessActivationModal: React.FC<BusinessActivationModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [proxyType, setProxyType] = useState<'dynamic' | 'static'>('dynamic');
  const [loading, setLoading] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const [prices, setPrices] = useState<ResourcePrices | null>(null);
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

  // 获取价格配置
  useEffect(() => {
    if (visible && currentUser?.id) {
      getResourcePrices(currentUser.id.toString())
        .then(priceData => {
          setPrices(priceData);
        })
        .catch(error => {
          console.error('获取价格配置失败:', error);
          message.error('获取价格配置失败');
        });
    }
  }, [visible, currentUser?.id]);

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

  // 加载初始数据
  const loadInitialData = React.useCallback(async () => {
    try {
      console.log('[loadInitialData] 开始加载初始数据');
      const regionsData = await ipProxyAPI.getAreaList();
      setRegions(regionsData.map(convertAreaResponseToArea));
    } catch (error) {
      console.error('加载初始数据失败:', error);
      message.error('加载数据失败');
    }
  }, []);

  // 加载初始数据
  useEffect(() => {
    if (visible) {
      // 初始化token
      ipProxyAPI.initToken();
      loadInitialData();
    }
  }, [visible, loadInitialData]);

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
      const ranges = await ipProxyAPI.getIpRanges({
        regionCode: values.region,
        countryCode: values.country,
        cityCode: values.city,
        staticType: values.staticType
      });
      
      // 转换 IpRange 到 DisplayIpRange
      const convertedRanges: DisplayIpRange[] = ranges.map(range => ({
        range: `${range.ipStart}-${range.ipEnd}`,
        stock: range.stock
      }));
      
      setIpRanges(convertedRanges);
    } catch (error) {
      console.error('加载IP段失败:', error);
      message.error('加载IP段失败');
    }
  };

  // 计算总费用
  const calculateTotalCost = (values: any) => {
    if (!prices) return;
    
    if (proxyType === 'dynamic') {
      const traffic = parseFloat(values.traffic || '0');
      const total = traffic * prices.dynamic_proxy_price;
      setTotalCost(total);
      setHasInput(traffic > 0);
    } else {
      const quantity = parseFloat(values.quantity || '0');
      const duration = parseInt(values.duration || '0');
      const total = quantity * duration * prices.static_proxy_price;
      setTotalCost(total);
      setHasInput(quantity > 0 && duration > 0);
    }
  };

  // 处理表单值变化
  const handleValuesChange = React.useCallback((changedValues: any, allValues: any) => {
    // 计算总费用
    calculateTotalCost(allValues);

    // 处理级联选择
    if ('region' in changedValues) {
      handleRegionChange(changedValues.region);
    }
    if ('country' in changedValues) {
      handleCountryChange(changedValues.country);
    }
    if ('city' in changedValues || 'staticType' in changedValues) {
      loadIpRanges(allValues);
    }
  }, [calculateTotalCost, handleRegionChange, handleCountryChange, loadIpRanges]);

  const handleProxyTypeChange = (e: RadioChangeEvent) => {
    setProxyType(e.target.value);
    form.resetFields(['poolType', 'traffic', 'region', 'country', 'city', 'staticType', 'ipRange', 'duration', 'quantity', 'remark']);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      if (!prices) {
        message.error('价格配置获取失败，请刷新重试');
        return;
      }

      // 使用动态价格计算总费用
      const total_cost = proxyType === 'dynamic'
        ? parseInt(values.traffic || '0') * prices.dynamic_proxy_price
        : parseInt(values.quantity || '0') * parseInt(values.duration?.toString() || '0') * prices.static_proxy_price;

      const orderData: OrderData = {
        userId: user.id.toString(),
        username: user.username,
        proxyType: values.proxyType,
        poolType: values.poolType,
        traffic: values.traffic,
        region: values.region,
        country: values.country,
        city: values.city,
        staticType: values.staticType,
        ipRange: values.ipRange,
        duration: values.duration,
        quantity: values.quantity,
        remark: values.remark,
        agentId: currentUser?.id.toString() || '',
        agentUsername: currentUser?.username || '',
        total_cost: total_cost
      };

      console.log('=== 业务开通请求信息 ===');
      console.log('代理商ID:', currentUser?.id);
      console.log('代理商用户名:', currentUser?.username);
      console.log('用户ID:', user.id);
      console.log('用户名:', user.username);
      console.log('请求数据:', orderData);
      
      const response = await api.post(`/api/user/${user.id}/activate-business`, orderData);
      
      if (response.data?.code === 0) {
        message.success(response.data.msg || '业务激活成功');
        onSuccess();
        onCancel();
      } else {
        message.error(response.data?.msg || '业务激活失败');
      }
    } catch (error: any) {
      console.error('业务激活失败:', error);
      if (error.response?.status === 403) {
        message.error('没有权限执行此操作');
      } else if (error.response?.status === 400) {
        message.error(error.response.data?.msg || '请求参数错误');
      } else {
        message.error(error.response?.data?.msg || '业务激活失败，请稍后重试');
      }
    } finally {
      setLoading(false);
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
      return (
        <div className={styles.priceInfo}>
          单价：{prices.dynamic_proxy_price}元/m
        </div>
      );
    }
    return (
      <div className={styles.priceInfo}>
        单价：{prices.static_proxy_price}元/IP/天
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
      name="ipRange"
      label="IP段"
      rules={[{ required: true, message: '请选择IP段' }]}
      extra={selectedIpRange ? `当前IP段库存: ${selectedIpRange.stock}个` : ''}
    >
      <Select 
        placeholder="请选择IP段"
        disabled={!form.getFieldValue('city') || !form.getFieldValue('staticType')}
        onChange={(value) => {
          const range = ipRanges.find(r => r.range === value);
          setSelectedIpRange(range || null);
        }}
      >
        {ipRanges.map((range, index) => (
          range.range ? (
            <Option 
              key={range.range} 
              value={range.range}
            >
              {range.range} (库存: {range.stock}个)
            </Option>
          ) : (
            <Option 
              key={`range-${range.stock}-${index}`}
              value={`range-${range.stock}-${index}`}
            >
              未知IP段 (库存: {range.stock}个)
            </Option>
          )
        ))}
      </Select>
    </Form.Item>
  );

  return (
    <Modal
      title="业务开通"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      className={styles.businessModal}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
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
                    { type: 'string', min: 1, message: '请输入大于0的数字' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="1000m=1Gb"
                    min={1}
                    stringMode
                    onChange={(value) => {
                      form.setFieldValue('traffic', value?.toString());
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

        <Row justify="end" style={{ marginTop: 24 }}>
          <Col>
            <Space>
              <Button onClick={onCancel}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                disabled={!hasInput || (proxyType === 'static' && totalCost > (currentUser?.balance || 0))}
              >
                支付
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default BusinessActivationModal; 