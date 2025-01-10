import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, DatePicker, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { AgentOrder } from '@/types/order';
import AgentOrderDetailModal from '@/components/Order/AgentOrderDetailModal';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AgentOrderPage: React.FC = () => {
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [timeRange, setTimeRange] = useState<[string, string] | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AgentOrder | null>(null);

  // 模拟数据，实际应从API获取
  const agents = [
    { id: '1', name: '代理商1' },
    { id: '2', name: '代理商2' },
  ];

  const orders: AgentOrder[] = [
    {
      id: '1',
      orderNo: 'DD2023122800001',
      agentId: '1',
      agentName: '代理商1',
      amount: 1000.00,
      status: 'pending',
      createdAt: '2023-12-28 12:00:00',
    },
    {
      id: '2',
      orderNo: 'DD2023122800002',
      agentId: '2',
      agentName: '代理商2',
      amount: 2000.00,
      status: 'paid',
      createdAt: '2023-12-28 13:00:00',
      paidAt: '2023-12-28 13:05:00',
    },
  ];

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '代理商',
      dataIndex: 'agentName',
      key: 'agentName',
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
        <span className={status === 'paid' ? 'text-green-500' : 'text-yellow-500'}>
          {status === 'paid' ? '已支付' : '待支付'}
        </span>
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
      render: (_: any, record: AgentOrder) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button type="link" onClick={() => handleConfirmPayment(record)}>
              确认支付
            </Button>
          )}
          <Button type="link" onClick={() => handleViewDetail(record)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = () => {
    // TODO: 实现搜索逻辑
    message.info('搜索功能待实现');
  };

  const handleConfirmPayment = (order: AgentOrder) => {
    // TODO: 实现确认支付逻辑
    message.info('确认支付功能待实现');
  };

  const handleViewDetail = (order: AgentOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <Space>
            <Input
              placeholder="请输入订单号"
              value={searchOrderNo}
              onChange={e => setSearchOrderNo(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="代理商"
              style={{ width: 200 }}
              value={selectedAgent}
              onChange={value => setSelectedAgent(value)}
            >
              <Option value="">全部</Option>
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {agent.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              value={status}
              onChange={value => setStatus(value)}
            >
              <Option value="">全部</Option>
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
            </Select>
            <RangePicker
              showTime
              onChange={(dates, dateStrings) => setTimeRange(dateStrings as [string, string])}
            />
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button
              onClick={() => {
                setSearchOrderNo('');
                setSelectedAgent('');
                setStatus('');
                setTimeRange(null);
              }}
            >
              重置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          pagination={{
            total: 100,
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
          }}
        />

        <AgentOrderDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          order={selectedOrder}
        />
      </div>
    </>
  );
};

export default AgentOrderPage; 