import React from 'react';
import { Card, Form, InputNumber, Button, message, Table, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getResourcePrices, updateResourcePrices } from '@/services/settingsService';
import type { ResourcePrices } from '@/services/settingsService';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_PRICES: ResourcePrices = {
  dynamic_proxy_price: 5.0,  // 动态代理默认价格：5元/GB
  static_proxy_price: 10.0   // 静态代理默认价格：10元/IP
};

const PriceConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [prices, setPrices] = React.useState<ResourcePrices>(DEFAULT_PRICES);
  const { user } = useAuth();

  // 加载价格设置
  const loadPrices = async () => {
    if (!user?.id) {
      message.error('用户信息未加载');
      return;
    }

    try {
      const data = await getResourcePrices(user.id.toString());
      setPrices(data);
      form.setFieldsValue(data);
    } catch (error) {
      console.error('加载价格设置失败:', error);
    }
  };

  React.useEffect(() => {
    if (user?.id) {
      loadPrices();
    }
  }, [user]);

  // 保存价格设置
  const handleSubmit = async (values: ResourcePrices) => {
    if (!user?.id) {
      message.error('用户信息未加载');
      return;
    }

    setLoading(true);
    try {
      const success = await updateResourcePrices(user.id.toString(), values);
      if (success) {
        loadPrices();
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '默认单价',
      dataIndex: 'price',
      key: 'price',
      render: (text: number) => `¥${text.toFixed(2)}`,
    },
    {
      title: '计费单位',
      dataIndex: 'unit',
      key: 'unit',
    }
  ];

  const data = [
    {
      key: '1',
      type: '动态代理',
      price: prices.dynamic_proxy_price,
      unit: '元/GB'
    },
    {
      key: '2',
      type: '静态代理',
      price: prices.static_proxy_price,
      unit: '元/IP'
    },
  ];

  return (
    <Card title="代理商默认价格设置" bordered={false}>
      <Alert
        message="价格说明"
        description={
          <ul>
            <li>动态代理：按流量计费，单位为元/GB</li>
            <li>静态代理：按IP数量计费，单位为元/IP</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        style={{ marginBottom: 24 }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={DEFAULT_PRICES}
      >
        <Form.Item
          label="动态代理默认单价（元/GB）"
          name="dynamic_proxy_price"
          rules={[
            { required: true, message: '请输入动态代理默认单价' },
            { type: 'number', min: 0, message: '价格不能小于0' },
          ]}
        >
          <InputNumber
            prefix="¥"
            step={0.1}
            precision={2}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item
          label="静态代理默认单价（元/IP）"
          name="static_proxy_price"
          rules={[
            { required: true, message: '请输入静态代理默认单价' },
            { type: 'number', min: 0, message: '价格不能小于0' },
          ]}
        >
          <InputNumber
            prefix="¥"
            step={0.1}
            precision={2}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            htmlType="submit"
          >
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PriceConfig; 