import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import type { UserDynamicOrder } from '@/types/order';
import UserDynamicOrderDetailModal from '@/components/Order/UserDynamicOrderDetailModal';

const { Option } = Select;

const UserDynamicOrderPage: React.FC = () => {
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchUserAccount, setSearchUserAccount] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<UserDynamicOrder | null>(null);

  // 模拟数据，实际应从API获取
  const agents = [
    { id: '1', name: '代理商1' },
    { id: '2', name: '代理商2' },
  ];

  const orders: UserDynamicOrder[] = [
    {
      id: '1',
      orderNo: 'DD2023122800001',
      userId: 'user1',
      userAccount: 'user001',
      agentId: '1',
      agentName: '代理商1',
      duration: '60分钟',
      remark: '测试订单',
      createdAt: '2023-12-28 12:00:00',
    },
    // ... 更多订单数据
  ];

  const columns = [
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
      dataIndex: 'agentName',
      key: 'agentName',
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
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserDynamicOrder) => (
        <Space size="middle">
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

  const handleViewDetail = (order: UserDynamicOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-4 flex justify-between">
          <Space>
            <Input
              placeholder="请输入订单号"
              value={searchOrderNo}
              onChange={e => setSearchOrderNo(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Input
              placeholder="请输入用户账号"
              value={searchUserAccount}
              onChange={e => setSearchUserAccount(e.target.value)}
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
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button
              onClick={() => {
                setSearchOrderNo('');
                setSearchUserAccount('');
                setSelectedAgent('');
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

        <UserDynamicOrderDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          order={selectedOrder}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserDynamicOrderPage; 