import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Input, Button, Space, Select, message, Tag } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import ipProxyAPI from '@/utils/ipProxyAPI';

const { Option } = Select;

interface StaticProxy {
  id: string;
  ip: string;
  subnet: string;
  protocol: string;
  status: string;
  location: string;
  resourceType: string;
  createdAt: string;
}

const StaticProxyPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [proxies, setProxies] = useState<StaticProxy[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({});

  const fetchProxies = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    params = searchParams
  ) => {
    try {
      setLoading(true);
      const response = await ipProxyAPI.getStaticProxies({
        page,
        pageSize,
        ...params,
      });

      setProxies(response.list);
      setPagination({
        ...pagination,
        current: page,
        total: response.total,
      });
    } catch (error) {
      console.error('获取代理列表失败:', error);
      message.error('获取代理列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxies();
  }, []);

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => {
    fetchProxies(newPagination.current, newPagination.pageSize, {
      ...searchParams,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  const handleSearch = (values: any) => {
    setSearchParams(values);
    fetchProxies(1, pagination.pageSize, values);
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
    fetchProxies(1, pagination.pageSize, {});
  };

  const columns = [
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
    {
      title: '子网掩码',
      dataIndex: 'subnet',
      key: 'subnet',
      width: 120,
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '异常'}
        </Tag>
      ),
    },
    {
      title: '地理位置',
      dataIndex: 'location',
      key: 'location',
      width: 160,
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-4">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="ip" label="IP地址">
            <Input placeholder="请输入IP地址" allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              <Option value="active">正常</Option>
              <Option value="error">异常</Option>
            </Select>
          </Form.Item>
          <Form.Item name="protocol" label="协议">
            <Select placeholder="请选择协议" allowClear style={{ width: 120 }}>
              <Option value="http">HTTP</Option>
              <Option value="https">HTTPS</Option>
              <Option value="socks5">SOCKS5</Option>
            </Select>
          </Form.Item>
          <Form.Item name="resourceType" label="资源类型">
            <Select placeholder="请选择资源类型" allowClear style={{ width: 120 }}>
              <Option value="residential">住宅IP</Option>
              <Option value="datacenter">数据中心IP</Option>
              <Option value="mobile">移动IP</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button icon={<SyncOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={proxies}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default StaticProxyPage;
