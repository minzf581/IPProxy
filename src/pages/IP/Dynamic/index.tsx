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
  Modal
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface IPData {
  id: string;
  ip: string;
  port: number;
  location: string;
  status: 'active' | 'inactive';
  type: string;
  expireTime: string;
  createTime: string;
}

const DynamicIPPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IPData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 表格列配置
  const columns: ColumnsType<IPData> = [
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
      width: 100,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '活跃' : '不活跃'}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '到期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 180,
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
      width: 120,
      render: (_, record: IPData) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<IPData>['onChange'] = (
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
      const response = await fetch('/api/dynamic-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      // 模拟数据
      const mockData: IPData[] = Array(10).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        port: Math.floor(Math.random() * 60000) + 1024,
        location: ['中国', '美国', '日本', '韩国', '新加坡'][Math.floor(Math.random() * 5)],
        status: Math.random() > 0.3 ? 'active' : 'inactive',
        type: ['HTTP', 'HTTPS', 'SOCKS5'][Math.floor(Math.random() * 3)],
        expireTime: dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
        createTime: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
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

  // 查看详情
  const handleViewDetails = (record: IPData) => {
    Modal.info({
      title: 'IP详情',
      width: 600,
      content: (
        <div className={styles.ipDetail}>
          <p><strong>IP地址：</strong>{record.ip}</p>
          <p><strong>端口：</strong>{record.port}</p>
          <p><strong>位置：</strong>{record.location}</p>
          <p><strong>状态：</strong>
            <Tag color={record.status === 'active' ? 'success' : 'default'}>
              {record.status === 'active' ? '活跃' : '不活跃'}
            </Tag>
          </p>
          <p><strong>类型：</strong>{record.type}</p>
          <p><strong>到期时间：</strong>{record.expireTime}</p>
          <p><strong>创建时间：</strong>{record.createTime}</p>
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
    <div className={styles.dynamicIP}>
      <Card bordered={false}>
        <Form
          form={form}
          layout="inline"
          className={styles.searchForm}
          onFinish={handleSearch}
        >
          <Form.Item name="ip">
            <Input
              placeholder="请输入IP地址"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="location">
            <Input
              placeholder="请输入位置"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="IP状态"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '活跃', value: 'active' },
                { label: '不活跃', value: 'inactive' },
              ]}
            />
          </Form.Item>
          <Form.Item name="type">
            <Select
              placeholder="IP类型"
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
          scroll={{ x: 1300 }}
          className={styles.table}
        />
      </Card>
    </div>
  );
};

export default DynamicIPPage; 