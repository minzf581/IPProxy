import React, { useState } from 'react';
import { Table, Input, Select, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface OrderData {
  orderNo: string;
  userAccount: string;
  agent: string;
  duration: string;
  remark: string;
  createdAt: string;
}

const UserDynamicOrders: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

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
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">查看详情</Button>
        </Space>
      ),
    },
  ];

  const data: OrderData[] = [
    {
      orderNo: 'DD20231228000001',
      userAccount: 'user001',
      agent: '代理商1',
      duration: '60分钟',
      remark: '测试订单',
      createdAt: '2023-12-28 12:00:00',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="请输入订单号"
            style={{ width: 200 }}
            onSearch={(value) => console.log(value)}
          />
          <Search
            placeholder="请输入用户账号"
            style={{ width: 200 }}
            onSearch={(value) => console.log(value)}
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => setSelectedAgent(value)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'agent1', label: '代理商1' },
              { value: 'agent2', label: '代理商2' },
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

export default UserDynamicOrders;
