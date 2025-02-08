import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, message } from 'antd';
import type { User } from '@/types/user';
import { ipProxyAPI, AreaResponse } from '@/utils/ipProxyAPI';
import { getResourcePrices } from '@/services/settingsService';
import { City } from '@/types/api';

interface CountryItem {
  code: string;
  name: string;
  cname: string;
}

interface BusinessActivationModalProps {
  visible: boolean;
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const BusinessActivationModal: React.FC<BusinessActivationModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [areaList, setAreaList] = useState<AreaResponse[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // 加载初始数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // 加载区域列表
        const response = await ipProxyAPI.getAreaList();
        console.log('[BusinessActivationModal] 区域列表响应:', response);
        
        if (Array.isArray(response)) {
          setAreaList(response);
          console.log('[BusinessActivationModal] 成功设置区域列表:', response);
        } else {
          console.error('[BusinessActivationModal] 区域列表格式错误:', response);
          message.error('获取区域列表失败');
          setAreaList([]);
        }
        
        // 加载价格设置
        if (user.id) {
          const prices = await getResourcePrices(user.id.toString());
          console.log('[BusinessActivationModal] 价格设置:', prices);
        }
      } catch (error: any) {
        console.error('[BusinessActivationModal] 加载数据失败:', error);
        message.error(error.message || '加载数据失败');
        setAreaList([]);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadInitialData();
    }
  }, [visible, user.id]);

  const handleRegionChange = async (regionCode: string) => {
    console.log('[handleRegionChange] 开始处理区域变化:', regionCode);
    try {
      setLoading(true);
      
      // 从已加载的区域列表中找到选中的区域
      const selectedRegion = areaList.find(
        (region) => region.code === regionCode
      );
      console.log('[handleRegionChange] 选中的区域:', selectedRegion);
      
      if (selectedRegion?.children && Array.isArray(selectedRegion.children)) {
        const countryList = selectedRegion.children.map(country => ({
          code: country.code,
          name: country.name || '',
          cname: country.cname
        }));
        console.log('[handleRegionChange] 从缓存设置国家列表:', countryList);
        setCountries(countryList);
      } else {
        // 如果没有找到子项，尝试重新获取该区域的国家列表
        const response = await ipProxyAPI.getCountriesByRegion(regionCode);
        console.log('[handleRegionChange] API响应:', response);
        
        if (Array.isArray(response)) {
          // 直接使用API返回的数据
          const countryList = response.map(country => ({
            code: country.code,
            name: country.name || '',
            cname: country.cname
          }));
          console.log('[handleRegionChange] 从API获取的国家列表:', countryList);
          setCountries(countryList);
        } else {
          console.error('[handleRegionChange] API返回数据格式错误:', response);
          message.error('获取国家列表失败');
          setCountries([]);
        }
      }
    } catch (error) {
      console.error('[handleRegionChange] 加载区域数据失败:', error);
      message.error('加载区域数据失败，请重试');
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = async (countryCode: string) => {
    if (!countryCode) {
      console.warn('[BusinessActivationModal] handleCountryChange - 国家代码为空');
      return;
    }

    try {
      setLoading(true);
      console.log('[BusinessActivationModal] handleCountryChange - 开始获取城市列表，国家代码:', countryCode);
      
      const cityList = await ipProxyAPI.getCitiesByCountry(countryCode);
      console.log('[BusinessActivationModal] handleCountryChange - API返回的城市列表:', cityList);
      
      if (Array.isArray(cityList) && cityList.length > 0) {
        console.log('[BusinessActivationModal] handleCountryChange - 设置城市列表，数量:', cityList.length);
        setCities(cityList);
        
        // 清空已选择的城市
        form.setFieldValue('city', undefined);
        
        // 打印第一个城市数据作为示例
        console.log('[BusinessActivationModal] handleCountryChange - 城市数据示例:', cityList[0]);
      } else {
        console.warn('[BusinessActivationModal] handleCountryChange - 未获取到城市数据');
        message.warning(`未找到${countryCode}的城市数据`);
        setCities([]);
      }
    } catch (error) {
      console.error('[BusinessActivationModal] handleCountryChange - 错误:', error);
      message.error('获取城市列表失败');
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 同步库存
      try {
        console.log('[BusinessActivationModal] 开始同步库存');
        await ipProxyAPI.syncInventory();
        console.log('[BusinessActivationModal] 库存同步成功');
      } catch (error: any) {
        console.error('[BusinessActivationModal] 库存同步失败:', error);
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.msg || error.message;
          
          switch (status) {
            case 401:
              message.error('登录已过期，请重新登录');
              return;
            case 403:
              message.error('没有权限执行此操作');
              return;
            case 500:
              message.error(`服务器错误: ${errorMsg}`);
              return;
            default:
              message.error(`同步库存失败: ${errorMsg}`);
              return;
          }
        } else if (error.request) {
          message.error('网络请求失败，请检查网络连接');
          return;
        } else {
          message.error('同步库存失败，请稍后重试');
          return;
        }
      }

      // 处理业务开通逻辑
      try {
        // TODO: 实现业务开通逻辑
        console.log('[BusinessActivationModal] 开始处理业务开通，表单数据:', values);
        
        // 调用成功回调
        onSuccess();
        message.success('业务开通成功');
      } catch (error: any) {
        console.error('[BusinessActivationModal] 业务开通失败:', error);
        message.error('业务开通失败，请重试');
      }
    } catch (error) {
      console.error('[BusinessActivationModal] 表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCitySelector = () => {
    console.log('[BusinessActivationModal] renderCitySelector - 开始渲染，当前cities状态:', cities);

    return (
      <Form.Item
        name="city"
        label="城市"
        rules={[{ required: true, message: '请选择城市' }]}
      >
        <Select
          loading={loading}
          placeholder="请选择城市"
          disabled={!form.getFieldValue('country')}
          showSearch
          optionFilterProp="children"
          style={{ width: '100%' }}
        >
          {Array.isArray(cities) && cities.map((city, index) => {
            console.log(`[BusinessActivationModal] renderCitySelector - 处理城市 ${index}:`, city);
            const cityCode = city.cityCode || city.code;
            
            // 优先使用中文名称，如果没有则使用英文名称
            const displayName = city.cname || city.name || cityCode;
            
            // 如果显示名称与城市代码不同，则在括号中显示城市代码
            const fullDisplayName = displayName === cityCode ? 
              displayName : 
              `${displayName} (${cityCode})`;
            
            if (!cityCode) {
              console.warn(`[BusinessActivationModal] renderCitySelector - 城市 ${index} 数据无效:`, city);
              return null;
            }

            console.log(`[BusinessActivationModal] renderCitySelector - 渲染城市选项:`, {
              index,
              cityCode,
              displayName,
              fullDisplayName
            });

            return (
              <Select.Option 
                key={cityCode}
                value={cityCode}
                title={fullDisplayName}
              >
                {fullDisplayName}
              </Select.Option>
            );
          })}
        </Select>
      </Form.Item>
    );
  };

  return (
    <Modal
      title="业务开通"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item label="用户账号">
          <Input value={user.username} disabled />
        </Form.Item>
        <Form.Item
          name="region"
          label="区域"
          rules={[{ required: true, message: '请选择区域' }]}
        >
          <Select 
            onChange={handleRegionChange}
            loading={loading}
            placeholder="请选择区域"
          >
            {areaList.map(area => (
              <Select.Option key={area.code} value={area.code}>
                {area.cname}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="country"
          label="国家"
          rules={[{ required: true, message: '请选择国家' }]}
        >
          <Select 
            loading={loading}
            placeholder="请选择国家"
            disabled={countries.length === 0}
            onChange={handleCountryChange}
          >
            {countries.map(country => (
              <Select.Option key={country.code} value={country.code}>
                {country.cname}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {renderCitySelector()}
        <Form.Item
          name="amount"
          label="开通数量"
          rules={[{ required: true, message: '请输入开通数量' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BusinessActivationModal; 