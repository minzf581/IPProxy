import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Descriptions, Row, Col, Table, Alert, Space, Tooltip, Select } from 'antd';
import { LockOutlined, SaveOutlined, EditOutlined, InfoCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';
import { updatePassword } from '@/services/auth';
import { getProductPrices } from '@/services/productInventory';
import PriceSettingsModal from '@/components/PriceSettings/PriceSettingsModal';
import PriceImportExport from '@/components/PriceSettings/PriceImportExport';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
import type { ProductPrice } from '@/types/product';
import type { ColumnsType } from 'antd/es/table';
import { getMappedValue, getUniqueValues, PRODUCT_NO_MAP, PROXY_TYPE_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import type { ProductPriceParams } from '@/types/api';

const { Option } = Select;

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type PriceTableItem = ProductPrice & { key: number };

const SettingsPage: React.FC = () => {
  const [passwordForm] = Form.useForm<ChangePasswordForm>();
  const [loading, setLoading] = React.useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
  const [prices, setPrices] = useState<PriceTableItem[]>([]);
  const { user } = useAuth();

  const [filterOptions, setFilterOptions] = useState<{
    types: { text: string; value: string }[];
    proxyTypes: { text: string; value: string }[];
    areas: { text: string; value: string }[];
    countries: { text: string; value: string }[];
    cities: { text: string; value: string }[];
  }>({
    types: [],
    proxyTypes: [],
    areas: [],
    countries: [],
    cities: [],
  });

  // 加载价格数据
  const loadPrices = async () => {
    console.log('[Settings] 开始加载价格数据...');
    try {
      setLoading(true);
      const response = await getProductPrices({ 
        isGlobal: true
      });
      console.log('[Settings] API响应:', response);
      
      if (response.code === 0 || response.code === 200) {  // 兼容两种成功状态码
        if (!response.data) {
          console.error('[Settings] API响应中没有data字段:', response);
          message.error('获取价格数据失败: 响应数据格式错误');
          return;
        }
        
        console.log('[Settings] 开始处理价格数据，原始数据:', response.data);
        const formattedData = response.data.map((item, index) => ({
          ...item,
          key: index
        }));
        console.log('[Settings] 处理后的数据:', formattedData);
        
        setPrices(formattedData);
        message.success(`成功加载 ${formattedData.length} 条价格数据`);
      } else {
        console.error('[Settings] API响应状态码错误:', response.code);
        message.error(response.message || '获取价格数据失败');
      }
    } catch (error) {
      console.error('[Settings] 加载价格数据失败:', error);
      message.error('加载价格数据失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
      console.log('[Settings] 价格数据加载完成');
    }
  };

  // 在组件挂载时加载数据
  useEffect(() => {
    loadPrices();
  }, []);

  // 更新筛选选项
  useEffect(() => {
    if (prices.length > 0) {
      // 获取产品类型选项
      const types = getUniqueValues(prices, 'type').map(type => ({
        text: getMappedValue(PRODUCT_NO_MAP, type),
        value: type
      }));
      
      // 获取代理类型选项
      const proxyTypes = getUniqueValues(prices, 'proxyType').map(proxyType => ({
        text: getMappedValue(PROXY_TYPE_MAP, Number(proxyType)),
        value: String(proxyType)
      }));
      
      // 获取区域选项
      const areas = getUniqueValues(prices, 'area').map(area => ({
        text: getMappedValue(AREA_MAP, area),
        value: area
      }));
      
      // 获取国家选项
      const countries = getUniqueValues(prices, 'country').map(country => ({
        text: getMappedValue(COUNTRY_MAP, country),
        value: country
      }));
      
      // 获取城市选项
      const cities = getUniqueValues(prices, 'city').map(city => ({
        text: city,
        value: city
      }));

      setFilterOptions({ types, proxyTypes, areas, countries, cities });
    }
  }, [prices]);

  const handlePasswordSubmit = async (values: ChangePasswordForm) => {
    if (!user) {
      message.error('用户未登录');
      return;
    }

    setLoading(true);
    try {
      const success = await updatePassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      if (success) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error('密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('密码修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: ProductPrice) => {
    setSelectedPrice(record);
    setVisible(true);
  };

  const columns: ColumnsType<ProductPrice> = [
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
      filters: Array.from(new Set(prices.map(item => item.city)))
        .filter(Boolean)
        .map(city => ({
          text: getMappedValue(CITY_MAP, city),
          value: city
        })),
      onFilter: (value: any, record: ProductPrice) => record.city === String(value)
    },
    {
      title: 'IP段',
      dataIndex: 'ipRange',
      key: 'ipRange',
      width: 180,
      ellipsis: {
        showTitle: false,
      },
      render: (ipRange: string) => (
        ipRange ? (
          <Tooltip placement="topLeft" title={ipRange}>
            {ipRange}
          </Tooltip>
        ) : '-'
      ),
    },
    {
      title: (
        <Space>
          价格
          <Tooltip title="此处设置的价格为系统全局默认价格">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a: ProductPrice, b: ProductPrice) => a.price - b.price,
      render: (price: number) => (
        <span style={{ fontWeight: 500, color: '#f50' }}>
          ¥{price.toFixed(1)}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: ProductPrice) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          修改
        </Button>
      )
    }
  ];

  if (!user) {
    return null;
  }

  const isAdmin = user.is_admin;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        {/* 账号信息和修改密码 */}
        <Col span={12}>
          <Card 
            title="账号信息" 
            bordered={false}
            style={{ 
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              marginBottom: 24
            }}
          >
            <Descriptions column={1}>
              <Descriptions.Item label="用户名">{user.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="账号类型">{isAdmin ? '管理员' : '代理商'}</Descriptions.Item>
              <Descriptions.Item label="账号状态">{user.status === 'active' ? '正常' : '禁用'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {user.created_at ? dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新时间">
                {user.updated_at ? dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title="修改密码" 
            bordered={false}
            style={{ 
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              marginBottom: 24
            }}
          >
            <Form<ChangePasswordForm>
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入当前密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能小于6位' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请再次输入新密码' },
                  { min: 6, message: '密码长度不能小于6位' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请再次输入新密码"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  htmlType="submit"
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 全局价格设置（仅管理员可见） */}
      {isAdmin && (
        <Card 
          title="全局价格设置" 
          bordered={false}
          style={{ 
            borderRadius: 8,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
          extra={
            <Space>
              <PriceImportExport
                currentData={prices}
                onImportSuccess={loadPrices}
              />
            </Space>
          }
        >
          <Alert
            message="价格说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>动态资源：按流量计费，单位为元/GB</li>
                <li>静态资源：按IP数量计费，单位为元/IP</li>
                <li>此处设置的价格为系统全局默认价格</li>
                <li>修改价格后将立即生效</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Table
            columns={columns}
            dataSource={prices}
            loading={priceLoading}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              defaultPageSize: 10,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
          />
        </Card>
      )}

      {/* 价格修改弹窗 */}
      <PriceSettingsModal
        visible={visible}
        initialData={selectedPrice}
        onSuccess={() => {
          setVisible(false);
          setSelectedPrice(null);
          loadPrices();
          message.success('价格更新成功');
        }}
        onCancel={() => {
          setVisible(false);
          setSelectedPrice(null);
        }}
      />
    </div>
  );
}

export default SettingsPage; 