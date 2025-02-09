import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Table, Button, message } from 'antd';
import { ipProxyAPI } from '../../../services/ipProxyAPI';
import { LocalArea } from '../../../types/localArea';
import { DisplayIpRange } from '../../../types/displayIpRange';

interface BusinessActivationModalProps {
  visible: boolean;
  user: {
    id: string;
    username: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

export const BusinessActivationModal: React.FC<BusinessActivationModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<LocalArea[]>([]);
  const [countries, setCountries] = useState<LocalArea[]>([]);
  const [cities, setCities] = useState<LocalArea[]>([]);
  const [ipRanges, setIpRanges] = useState<DisplayIpRange[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);

  // 加载初始数据
  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const regionsResponse = await ipProxyAPI.getAreaList();
      if (regionsResponse.code === 0 && regionsResponse.data) {
        setRegions(regionsResponse.data);
      } else {
        message.error(regionsResponse.message || '获取区域列表失败');
      }
    } catch (error) {
      message.error('加载初始数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理区域变更
  const handleRegionChange = async (regionCode: string) => {
    try {
      setLoading(true);
      form.setFieldsValue({ country: undefined, city: undefined });
      setCities([]);
      setCountries([]);
      
      const countriesResponse = await ipProxyAPI.getCountriesByRegion(regionCode);
      if (countriesResponse.code === 0 && countriesResponse.data) {
        setCountries(countriesResponse.data);
      } else {
        message.error(countriesResponse.message || '获取国家列表失败');
      }
    } catch (error) {
      message.error('获取国家列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理国家变更
  const handleCountryChange = async (countryCode: string) => {
    try {
      setLoading(true);
      form.setFieldsValue({ city: undefined });
      setCities([]);
      
      const citiesResponse = await ipProxyAPI.getCitiesByCountry(countryCode);
      if (citiesResponse.code === 0 && citiesResponse.data) {
        setCities(citiesResponse.data);
      } else {
        message.error(citiesResponse.message || '获取城市列表失败');
      }
    } catch (error) {
      message.error('获取城市列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理城市变更
  const handleCityChange = async (cityCode: string) => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      const params = {
        region_code: values.region,
        country_code: values.country,
        city_code: cityCode,
      };
      
      const ipRangesResponse = await ipProxyAPI.getIpRanges(params);
      if (ipRangesResponse.code === 0 && ipRangesResponse.data) {
        setIpRanges(ipRangesResponse.data);
        const total = ipRangesResponse.data.reduce((sum, range) => sum + range.cost, 0);
        setTotalCost(total);
      } else {
        message.error(ipRangesResponse.message || '获取 IP 范围列表失败');
        setIpRanges([]);
        setTotalCost(0);
      }
    } catch (error) {
      message.error('获取 IP 范围列表失败');
      setIpRanges([]);
      setTotalCost(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="业务开通"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSuccess}
      >
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
            {regions.map(region => (
              <Select.Option key={region.code} value={region.code}>
                {region.name}
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
            placeholder="请选择国家"
            onChange={handleCountryChange}
            loading={loading}
            disabled={!form.getFieldValue('region')}
          >
            {countries.map(country => (
              <Select.Option key={country.code} value={country.code}>
                {country.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="city"
          label="城市"
          rules={[{ required: true, message: '请选择城市' }]}
        >
          <Select
            placeholder="请选择城市"
            onChange={handleCityChange}
            loading={loading}
            disabled={!form.getFieldValue('country')}
          >
            {cities.map(city => (
              <Select.Option key={city.code} value={city.code}>
                {city.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Table
          dataSource={ipRanges}
          rowKey="id"
          loading={loading}
          pagination={false}
          columns={[
            {
              title: 'IP 范围',
              key: 'ipRange',
              render: (_, record) => `${record.start_ip} - ${record.end_ip}`,
            },
            {
              title: '区域',
              dataIndex: 'region_name',
            },
            {
              title: '国家',
              dataIndex: 'country_name',
            },
            {
              title: '城市',
              dataIndex: 'city_name',
            },
            {
              title: '成本',
              dataIndex: 'cost',
            },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                总成本
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                {totalCost}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            确认开通
          </Button>
        </div>
      </Form>
    </Modal>
  );
}; 