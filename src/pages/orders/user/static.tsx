import React from 'react';
import { Table, Input, Select, Button, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface OrderData {
  orderNo: string;
  userAccount: string;
  agent: string;
  ipInfo: string;
  location: string;
  resourceType: string;
  status: string;
  createdAt: string;
  expireAt: string;
}

const UserStaticOrders: React.FC = () => {
  const columns: ColumnsType<OrderData> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '用户账号',
      dataIndex: 'userAccount',
      key: 'userAccount',
    },
    {
      title: '代理商',
      dataIndex: 'agent',
      key: 'agent',
    },
    {
      title: 'IP信息',
      dataIndex: 'ipInfo',
      key: 'ipInfo',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color="success">使用中</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '到期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link">查看详情</Button>
      ),
    },
  ];

  const data: OrderData[] = [
    {
      orderNo: 'DD20231228000001',
      userAccount: 'user001',
      agent: '代理商1',
      ipInfo: '11.11.22.33:8080:testuser:testpass',
      location: '中国上海',
      resourceType: 'static1',
      status: '使用中',
      createdAt: '2023-12-28 12:00:00',
      expireAt: '2024-01-28 12:00:00',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Search
            placeholder="请输入订单号"
            style={{ width: 200 }}
          />
          <Search
            placeholder="请输入用户账号"
            style={{ width: 200 }}
          />
          <Search
            placeholder="请输入代理商账号"
            style={{ width: 200 }}
          />
          <Search
            placeholder="请输入IP地址"
            style={{ width: 200 }}
          />
          <Select
            defaultValue="全部"
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部' },
            ]}
          />
          <Button type="primary">查询</Button>
          <Button>重置</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="orderNo"
        pagination={{
          total: 100,
          pageSize: 10,
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default UserStaticOrders;
