import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  message,
  Modal,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface DynamicOrderData {
  id: string;
  orderNo: string;
  userId: string;
  agentId: string;
  amount: number;
  status: 'active' | 'expired' | 'pending';
  type: string;
  traffic: {
    total: number;
    used: number;
    unit: string;
  };
  expireTime: string;
  createTime: string;
  proxyInfo?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}

const DynamicOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DynamicOrderData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 表格列配置
  const columns: ColumnsType<DynamicOrderData> = [
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
      title: '代理商',
      dataIndex: 'agentId',
      key: 'agentId',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          active: { color: 'success', text: '使用中' },
          expired: { color: 'error', text: '已过期' },
          pending: { color: 'warning', text: '待支付' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Badge status={color as any} text={text} />;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '流量使用',
      key: 'traffic',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.traffic.used}/{record.traffic.total} {record.traffic.unit}</div>
          <div style={{ 
            width: '100%', 
            height: 4, 
            background: '#f0f0f0', 
            borderRadius: 2,
            marginTop: 4
          }}>
            <div style={{
              width: `${(record.traffic.used / record.traffic.total) * 100}%`,
              height: '100%',
              background: '#1890ff',
              borderRadius: 2,
            }} />
          </div>
        </div>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 180,
      render: (time: string) => {
        const isNearExpire = dayjs(time).diff(dayjs(), 'day') <= 7;
        return (
          <Tooltip title={isNearExpire ? '即将到期' : ''}>
            <span style={{ color: isNearExpire ? '#faad14' : 'inherit' }}>
              {isNearExpire && <ClockCircleOutlined style={{ marginRight: 4 }} />}
              {time}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record: DynamicOrderData) => (
        <Space size="middle">
          {record.status === 'active' && record.proxyInfo && (
            <Button 
              type="link" 
              icon={<CopyOutlined />}
              onClick={() => handleCopyProxy(record)}
            >
              复制代理
            </Button>
          )}
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<DynamicOrderData>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    fetchData({
      pageSize: pagination.pageSize,
      current: pagination.current,
      ...form.getFieldsValue(),
    });
  };

  // 获取数据
  const fetchData = async (params: any) => {
    setLoading(true);
    try {
      // TODO: 替换为实际的API调用
      const response = await fetch('/api/dynamic-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      // 模拟数据
      const mockData: DynamicOrderData[] = Array(10).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        orderNo: `DD${dayjs().format('YYYYMMDD')}${String(index + 1).padStart(6, '0')}`,
        userId: `user${index + 1}`,
        agentId: `agent${Math.floor(index / 3) + 1}`,
        amount: Math.floor(Math.random() * 10000) / 100,
        status: ['active', 'expired', 'pending'][Math.floor(Math.random() * 3)] as any,
        type: ['HTTP', 'HTTPS', 'SOCKS5'][Math.floor(Math.random() * 3)],
        traffic: {
          total: 100,
          used: Math.floor(Math.random() * 100),
          unit: 'GB'
        },
        expireTime: dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
        createTime: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
        proxyInfo: Math.random() > 0.3 ? {
          host: `proxy${index + 1}.example.com`,
          port: Math.floor(Math.random() * 60000) + 1024,
          username: `user${index + 1}`,
          password: `pass${index + 1}`,
        } : undefined,
      }));
      
      setData(mockData);
      setPagination({
        ...pagination,
        total: 100,
      });
    } catch (error) {
      message.error('获取数据失败');
    }
    setLoading(false);
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData({
      ...form.getFieldsValue(),
      current: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchData({
      current: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 复制代理信息
  const handleCopyProxy = (record: DynamicOrderData) => {
    if (record.proxyInfo) {
      const { host, port, username, password } = record.proxyInfo;
      const proxyString = `${username}:${password}@${host}:${port}`;
      navigator.clipboard.writeText(proxyString).then(() => {
        message.success('代理信息已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败，请手动复制');
        Modal.info({
          title: '代理信息',
          content: (
            <div>
              <p>请手动复制以下内容：</p>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                {proxyString}
              </pre>
            </div>
          ),
        });
      });
    }
  };

  // 查看详情
  const handleViewDetails = (record: DynamicOrderData) => {
    Modal.info({
      title: '订单详情',
      width: 600,
      content: (
        <div className={styles.orderDetail}>
          <p><strong>订单号：</strong>{record.orderNo}</p>
          <p><strong>用户账号：</strong>{record.userId}</p>
          <p><strong>代理商：</strong>{record.agentId}</p>
          <p><strong>金额：</strong>¥{record.amount.toFixed(2)}</p>
          <p><strong>状态：</strong>
            <Badge 
              status={
                record.status === 'active' ? 'success' :
                record.status === 'expired' ? 'error' : 'warning'
              } 
              text={
                record.status === 'active' ? '使用中' :
                record.status === 'expired' ? '已过期' : '待支付'
              }
            />
          </p>
          <p><strong>类型：</strong>{record.type}</p>
          <p><strong>流量使用：</strong>{record.traffic.used}/{record.traffic.total} {record.traffic.unit}</p>
          <p><strong>到期时间：</strong>{record.expireTime}</p>
          <p><strong>创建时间：</strong>{record.createTime}</p>
          {record.proxyInfo && (
            <>
              <p><strong>代理地址：</strong>{record.proxyInfo.host}</p>
              <p><strong>端口：</strong>{record.proxyInfo.port}</p>
              <p><strong>用户名：</strong>{record.proxyInfo.username}</p>
              <p><strong>密码：</strong>{record.proxyInfo.password}</p>
            </>
          )}
        </div>
      ),
    });
  };

  // 初始化加载数据
  React.useEffect(() => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, []);

  return (
    <div className={styles.dynamicOrder}>
      <Card bordered={false}>
        <Form
          form={form}
          layout="inline"
          className={styles.searchForm}
          onFinish={handleSearch}
        >
          <Form.Item name="orderNo">
            <Input
              placeholder="请输入订单号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="userId">
            <Input
              placeholder="请输入用户账号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="agentId">
            <Input
              placeholder="请输入代理商账号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="订单状态"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '使用中', value: 'active' },
                { label: '已过期', value: 'expired' },
                { label: '待支付', value: 'pending' },
              ]}
            />
          </Form.Item>
          <Form.Item name="type">
            <Select
              placeholder="代理类型"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: 'HTTP', value: 'HTTP' },
                { label: 'HTTPS', value: 'HTTPS' },
                { label: 'SOCKS5', value: 'SOCKS5' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker
              style={{ width: 260 }}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1800 }}
          className={styles.table}
        />
      </Card>
    </div>
  );
};

export default DynamicOrderPage;
