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
  duration: number;
  quantity: number;
  expireTime: string;
  createTime: string;
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

// 修改状态渲染函数
const renderStatus = (status: string) => {
  const statusMap: Record<string, { text: string; color: string }> = {
    '1': { text: '使用中', color: 'green' },
    '2': { text: '已过期', color: 'red' },
    'active': { text: '使用中', color: 'green' },
    'expired': { text: '已过期', color: 'red' }
  };
  return <span style={{ color: statusMap[status]?.color }}>{statusMap[status]?.text || status}</span>;
};

// 修改资源类型渲染函数
const renderResourceType = (type: string) => {
  const typeMap: Record<string, string> = {
    '1': '纯净静态1',
    '2': '纯净静态2',
    '3': '纯净静态3',
    '4': '纯净静态4',
    '5': '纯净静态5',
    '7': '纯净静态7'
  };
  return typeMap[type] || type;
};

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
    { label: '纯净静态1', value: '1' },
    { label: '纯净静态2', value: '2' },
    { label: '纯净静态3', value: '3' },
    { label: '纯净静态4', value: '4' },
    { label: '纯净静态5', value: '5' },
    { label: '纯净静态7', value: '7' }
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
      width: 120,
      render: (_, record) => {
        return record.city || '-';
      }
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
      render: renderResourceType
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
      render: renderStatus
    },
    {
      title: '代理时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => `${duration}个月`
    },
    {
      title: '代理数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number) => quantity
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 180,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
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

  const fetchData = async (page: number, size: number, search: any) => {
    setLoading(true);
    try {
      console.log('[Static Order List Debug] 开始获取静态订单列表数据');
      console.log('[Static Order List Debug] 请求参数:', { page, size, ...search });
      
      const params = {
        page,
        size,
        orderType: 'static',
        ...search
      };
      
      console.log('[Static Order List Debug] 发送请求参数:', params);
      
      const response = await request.post('/open/app/order/v2', params);
      
      console.log('[Static Order List Debug] API完整响应:', response);
      console.log('[Static Order List Debug] 响应数据:', response.data);
      
      if (response.data && response.data.code === 0) {
        const responseData = response.data.data || {};
        console.log('[Static Order List Debug] 响应数据内容:', responseData);
        console.log('[Static Order List Debug] 第一条数据示例:', responseData.list?.[0]);
        
        const list = Array.isArray(responseData.list) ? responseData.list : [];
        const total = typeof responseData.total === 'number' ? responseData.total : 0;
        
        const formattedList = list.map((item: any) => {
          console.log('[Static Order List Debug] 处理前的订单数据:', JSON.stringify(item, null, 2));
          
          // 获取代理商账号
          const agentAccount = item.agent_username || item.agent_account || '';
          
          // 获取位置信息，只保留城市
          const location = {
            city: item.city_name || item.city || ''
          };
          
          // 获取代理信息
          const proxyInfo = item.proxy_info || {
            ip: item.ip || '',
            port: item.port || 0,
            username: item.username || '',
            password: item.password || ''
          };

          // 计算过期时间
          const createTime = item.create_time || item.created_at || '';
          const duration = Number(item.duration || 0); // 代理时长（月）
          let expireTime = '';
          
          if (createTime && duration > 0) {
            expireTime = dayjs(createTime).add(duration, 'month').format('YYYY-MM-DD HH:mm:ss');
          }
          
          const formatted = {
            id: item.id || 0,
            orderNo: item.order_no || item.app_order_no || '',
            userId: item.user_id || 0,
            agentAccount,
            amount: Number(item.amount || item.order_amount || 0),
            status: String(item.status || item.order_status || ''),
            resourceType: item.static_type || item.resource_type || item.type || '',
            traffic: Number(item.traffic || 0),
            duration: duration,
            quantity: Number(item.quantity || 0),
            expireTime: expireTime,
            createTime: createTime,
            ...location,
            proxyInfo
          };
          
          console.log('[Static Order List Debug] 处理后的订单数据:', formatted);
          return formatted;
        });
        
        console.log('[Static Order List Debug] 格式化后的完整数据:', formattedList);
        setData(formattedList);
        setTotal(total);
      } else {
        console.error('[Static Order List Debug] 响应错误:', {
          code: response.data?.code,
          msg: response.data?.msg,
          data: response.data?.data
        });
        message.error(response.data?.msg || '获取数据失败');
        setData([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('[Static Order List Debug] 获取数据失败:', error);
      console.error('[Static Order List Debug] 错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      message.error(error.message || '获取数据失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 转换地区数据为级联选择器格式
  const convertLocationData = (data: any) => {
    if (!data || !data.regions || !data.countries || !data.cities) {
      console.warn('[Location Options Debug] 无效的地区数据格式:', data);
      return [];
    }

    return data.regions.map((region: any) => ({
      value: region.code,
      label: region.name,
      children: data.countries
        .filter((country: any) => country.region === region.code)
        .map((country: any) => ({
          value: country.code,
          label: country.name,
          children: data.cities
            .filter((city: any) => city.country === country.code)
            .map((city: any) => ({
              value: city.code,
              label: city.name
            }))
        }))
    }));
  };

  // 加载地理位置选项
  const loadLocationOptions = async () => {
    try {
      console.log('[Location Options Debug] 开始加载地区选项');
      const response = await request.get('/open/app/location/options/v2');
      
      console.log('[Location Options Debug] API完整响应:', response);
      console.log('[Location Options Debug] 响应数据:', response.data);
      
      // 检查响应数据结构
      if (response.data && response.data.code === 0) {
        const locationData = response.data.data || {};
        console.log('[Location Options Debug] 原始地区选项数据:', locationData);
        
        // 转换数据格式
        const formattedOptions = convertLocationData(locationData);
        console.log('[Location Options Debug] 转换后的地区选项:', formattedOptions);
        
        setLocationOptions(formattedOptions);
      } else {
        console.error('[Location Options Debug] 响应错误:', {
          code: response.data?.code,
          msg: response.data?.msg,
          data: response.data?.data
        });
        message.error(response.data?.msg || '加载地区选项失败');
        setLocationOptions([]);
      }
    } catch (error: any) {
      console.error('[Location Options Debug] 加载失败:', error);
      console.error('[Location Options Debug] 错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      message.error('加载地区选项失败');
      setLocationOptions([]);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize, {});
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
              <p><strong>位置信息：</strong>{currentOrder.city || '-'}</p>
              <p><strong>资源类型：</strong>{renderResourceType(currentOrder.resourceType)}</p>
              <p><strong>代理时长：</strong>{currentOrder.duration}个月</p>
              <p><strong>代理数量：</strong>{currentOrder.quantity}</p>
              <p><strong>金额：</strong>¥{currentOrder.amount.toFixed(2)}</p>
              <p><strong>状态：</strong>{renderStatus(currentOrder.status)}</p>
              <p><strong>过期时间：</strong>{currentOrder.expireTime ? dayjs(currentOrder.expireTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</p>
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