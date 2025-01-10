import React, { useState } from 'react';
import { Table, Input, Select, Button, Space, Tag, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface OrderData {
  orderNo: string;
  agent: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

const AgentOrders: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const columns: ColumnsType<OrderData> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '代理商',
      dataIndex: 'agent',
      key: 'agent',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'success' : 'warning'}>
          {status === 'paid' ? '已支付' : '待支付'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button type="link">确认支付</Button>
          )}
          <Button type="link">查看详情</Button>
        </Space>
      ),
    },
  ];

  const data: OrderData[] = [
    {
      orderNo: 'DD20231228000001',
      agent: '代理商1',
      amount: 1000.00,
      status: 'pending',
      createdAt: '2023-12-28 12:00:00',
    },
    {
      orderNo: 'DD20231228000002',
      agent: '代理商2',
      amount: 2000.00,
      status: 'paid',
      createdAt: '2023-12-28 13:00:00',
      paidAt: '2023-12-28 13:05:00',
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
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => setSelectedStatus(value)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待支付' },
              { value: 'paid', label: '已支付' },
            ]}
          />
          <RangePicker 
            placeholder={['Start date', 'End date']}
            style={{ width: 300 }}
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

export default AgentOrders;
