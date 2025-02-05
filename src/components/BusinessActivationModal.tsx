import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, message } from 'antd';
import type { User } from '@/types/user';
import { ipProxyAPI, AreaResponse } from '@/utils/ipProxyAPI';
import { getResourcePrices } from '@/services/settingsService';

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

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 处理业务开通逻辑
      onSuccess();
    } catch (error) {
      console.error('业务开通表单验证失败:', error);
    }
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
          >
            {countries.map(country => (
              <Select.Option key={country.code} value={country.code}>
                {country.cname}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
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