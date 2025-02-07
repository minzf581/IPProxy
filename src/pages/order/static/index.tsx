import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, message, Form, Input, Select, DatePicker, Cascader, Checkbox, Dropdown, Menu, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportToExcel, exportToTxt } from '@/utils/export';
import styles from './index.module.less';
import request from '@/utils/request';

interface StaticOrderData {
  id: number;
  orderNo: string;
  userId: number;
  agentAccount: string;
  amount: number;
  status: string;
  resourceType: string;
  traffic: number;
  expireTime: string;
  createTime: string;
  continent: string;
  country: string;
  province: string;
  city: string;
  proxyInfo?: {
    ip: string;
    port: number;
    username: string;
    password: string;
  };
}

interface SearchParams {
  orderNo?: string;
  userId?: number;
  agentAccount?: string;
  status?: string;
  resourceType?: string;
  location?: string[];
  startTime?: string;
  endTime?: string;
}

const StaticOrderPage: React.FC = () => {
  const [data, setData] = useState<StaticOrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<StaticOrderData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);

  // 资源类型选项
  const resourceTypeOptions = [
    { label: '静态资源1', value: 'static1' },
    { label: '静态资源2', value: 'static2' },
    { label: '静态资源3', value: 'static3' },
    { label: '静态资源4', value: 'static4' },
    { label: '静态资源5', value: 'static5' },
    { label: '静态资源7', value: 'static7' },
  ];

  const columns: ColumnsType<StaticOrderData> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      fixed: 'left',
    },
    {
      title: '用户账号',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
    },
    {
      title: '代理商账号',
      dataIndex: 'agentAccount',
      key: 'agentAccount',
      width: 120,
    },
    {
      title: '位置信息',
      key: 'location',
      width: 200,
      render: (_, record) => (
        <>
          {record.continent} / {record.country} / {record.province} / {record.city}
        </>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          '1': { text: '使用中', color: 'green' },
          '2': { text: '已过期', color: 'red' },
        };
        return <span style={{ color: statusMap[status]?.color }}>{statusMap[status]?.text}</span>;
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const fetchData = async (page = currentPage, size = pageSize, search = {}) => {
    setLoading(true);
    try {
      console.log('[Order List Debug] Fetching data with params:', { page, size, search });
      const response = await request.post('/open/app/order/v2', search, {
        params: {
          page,
          size
        }
      });
      
      console.log('[Order List Debug] Response:', response);
      
      if (response.code === 0) {
        const orderList = response.data.list || [];
        const totalCount = response.data.total || 0;
        
        // 确保数据格式正确
        const formattedData = orderList.map((order: any) => ({
          id: order.id || 0,
          orderNo: order.order_no || '',
          userId: order.user_id || 0,
          agentAccount: order.agent_username || '',
          amount: order.amount || 0,
          status: order.status || '',
          resourceType: order.resource_type || '',
          traffic: order.traffic || 0,
          expireTime: order.expire_time || '',
          createTime: order.created_at || '',
          continent: order.continent || '',
          country: order.country || '',
          province: order.province || '',
          city: order.city || '',
          proxyInfo: order.proxy_info || null
        }));
        
        console.log('[Order List Debug] Formatted data:', formattedData);
        
        setData(formattedData);
        setTotal(totalCount);
      } else {
        message.error(response.msg || '获取订单列表失败');
      }
    } catch (error: any) {
      console.error('[Order List Error]', error);
      message.error(error.message || '获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载地理位置选项
  const loadLocationOptions = async () => {
    try {
      console.log('[Location Options Debug] Loading location options');
      const response = await request.get('/open/app/location/options/v2');
      
      if (response.code === 0) {
        const options = response.data || {};
        const formattedOptions = [
          {
            value: 'all',
            label: '全部',
            children: Object.entries(options.regions || {}).map(([code, name]) => ({
              value: code,
              label: name,
              children: Object.entries(options.countries || {})
                .filter(([_, country]) => country.region === code)
                .map(([countryCode, country]) => ({
                  value: countryCode,
                  label: country.name,
                  children: Object.entries(options.cities || {})
                    .filter(([_, city]) => city.country === countryCode)
                    .map(([cityCode, city]) => ({
                      value: cityCode,
                      label: city.name
                    }))
                }))
            }))
          }
        ];
        
        console.log('[Location Options Debug] Formatted options:', formattedOptions);
        setLocationOptions(formattedOptions);
      }
    } catch (error: any) {
      console.error('[Location Options Error]', error);
      message.error('加载位置选项失败');
    }
  };

  useEffect(() => {
    fetchData();
    loadLocationOptions();
  }, []);

  const handleSearch = async (values: SearchParams) => {
    const params = {
      ...values,
      startTime: values.startTime ? dayjs(values.startTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      endTime: values.endTime ? dayjs(values.endTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
    };
    await fetchData(1, pageSize, params);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    const values = searchForm.getFieldsValue();
    fetchData(pagination.current, pagination.pageSize, values);
  };

  const showDetail = (order: StaticOrderData) => {
    setCurrentOrder(order);
    setDetailVisible(true);
  };

  const handleExport = (type: 'excel' | 'txt') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要导出的订单');
      return;
    }

    const selectedOrders = data.filter(item => selectedRowKeys.includes(item.id));
    
    if (type === 'excel') {
      exportToExcel(selectedOrders, '静态订单');
    } else {
      const ipList = selectedOrders.map(order => order.proxyInfo?.ip).filter(Boolean);
      exportToTxt(ipList.join('\n'), '静态IP列表');
    }
  };

  const exportMenu: MenuProps = {
    items: [
      {
        key: 'excel',
        label: '导出Excel',
        onClick: () => handleExport('excel')
      },
      {
        key: 'txt',
        label: '导出IP列表(TXT)',
        onClick: () => handleExport('txt')
      }
    ]
  };

  return (
    <div className={styles.container}>
      <Card bordered={false}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Form.Item name="orderNo" style={{ marginBottom: 0 }}>
                <Input placeholder="订单号" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="userId" style={{ marginBottom: 0 }}>
                <Input placeholder="用户账号" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="agentAccount" style={{ marginBottom: 0 }}>
                <Input placeholder="代理商账号" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="location" style={{ marginBottom: 0 }}>
                <Cascader
                  options={locationOptions}
                  placeholder="选择位置"
                  changeOnSelect
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Form.Item name="resourceType" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="资源类型"
                  allowClear
                  style={{ width: '100%' }}
                  options={resourceTypeOptions}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="状态"
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Select.Option value="1">使用中</Select.Option>
                  <Select.Option value="2">已过期</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
                <DatePicker.RangePicker 
                  style={{ width: '100%' }}
                  showTime
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
            <Col span={4} className={styles.buttonGroup}>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => searchForm.resetFields()}>
                重置
              </Button>
            </Col>
          </Row>
        </Form>

        <div className={styles.tableToolbar}>
          <Space>
            <Dropdown menu={exportMenu}>
              <Button icon={<DownloadOutlined />}>导出</Button>
            </Dropdown>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />

        <Modal
          title="订单详情"
          visible={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={800}
        >
          {currentOrder && (
            <div className={styles.orderDetail}>
              <p><strong>订单号：</strong>{currentOrder.orderNo}</p>
              <p><strong>用户账号：</strong>{currentOrder.userId}</p>
              <p><strong>代理商账号：</strong>{currentOrder.agentAccount}</p>
              <p><strong>位置信息：</strong>{currentOrder.continent} / {currentOrder.country} / {currentOrder.province} / {currentOrder.city}</p>
              <p><strong>资源类型：</strong>{currentOrder.resourceType}</p>
              <p><strong>金额：</strong>¥{currentOrder.amount.toFixed(2)}</p>
              <p><strong>状态：</strong>{currentOrder.status === '1' ? '使用中' : '已过期'}</p>
              <p><strong>过期时间：</strong>{dayjs(currentOrder.expireTime).format('YYYY-MM-DD HH:mm:ss')}</p>
              <p><strong>创建时间：</strong>{dayjs(currentOrder.createTime).format('YYYY-MM-DD HH:mm:ss')}</p>
              {currentOrder.proxyInfo && (
                <>
                  <p><strong>IP：</strong>{currentOrder.proxyInfo.ip}</p>
                  <p><strong>端口：</strong>{currentOrder.proxyInfo.port}</p>
                  <p><strong>用户名：</strong>{currentOrder.proxyInfo.username}</p>
                  <p><strong>密码：</strong>{currentOrder.proxyInfo.password}</p>
                </>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default StaticOrderPage; 