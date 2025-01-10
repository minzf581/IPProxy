import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { UserStaticOrder } from '@/types/order';
import UserStaticOrderDetailModal from '@/components/Order/UserStaticOrderDetailModal';

const { Option } = Select;

const UserStaticOrderPage: React.FC = () => {
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchUserAccount, setSearchUserAccount] = useState('');
  const [searchAgentAccount, setSearchAgentAccount] = useState('');
  const [searchIpSubnet, setSearchIpSubnet] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<UserStaticOrder | null>(null);

  // 模拟数据，实际应从API获取
  const orders: UserStaticOrder[] = [
    {
      id: '1',
      orderNo: 'DD2023122800001',
      userId: 'user1',
      userAccount: 'user001',
      agentId: '1',
      agentName: '代理商1',
      ipInfo: {
        subnet: '11.11.22.33',
        port: '8080',
        username: 'testuser',
        password: 'testpass',
        country: '中国',
        city: '上海',
        resourceType: 'static1'
      },
      status: 'active',
      createdAt: '2023-12-28 12:00:00',
      expiredAt: '2024-01-28 12:00:00',
      remark: '测试订单'
    },
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
      title: 'IP信息',
      key: 'ipInfo',
      render: (_: any, record: UserStaticOrder) => (
        <span>
          {`${record.ipInfo.subnet}:${record.ipInfo.port}:${record.ipInfo.username}:${record.ipInfo.password}`}
        </span>
      ),
    },
    {
      title: '位置',
      key: 'location',
      render: (_: any, record: UserStaticOrder) => (
        <span>{`${record.ipInfo.country} ${record.ipInfo.city}`}</span>
      ),
    },
    {
      title: '资源类型',
      dataIndex: ['ipInfo', 'resourceType'],
      key: 'resourceType',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'active' ? 'text-green-500' : 'text-red-500'}>
          {status === 'active' ? '使用中' : '已过期'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '到期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserStaticOrder) => (
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

  const handleViewDetail = (order: UserStaticOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <Space wrap>
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
            <Input
              placeholder="请输入代理商账号"
              value={searchAgentAccount}
              onChange={e => setSearchAgentAccount(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Input
              placeholder="请输入IP子网"
              value={searchIpSubnet}
              onChange={e => setSearchIpSubnet(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="资源类型"
              style={{ width: 200 }}
              value={selectedResourceType}
              onChange={value => setSelectedResourceType(value)}
            >
              <Option value="">全部</Option>
              <Option value="static1">静态资源1</Option>
              <Option value="static2">静态资源2</Option>
              <Option value="static3">静态资源3</Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button
              onClick={() => {
                setSearchOrderNo('');
                setSearchUserAccount('');
                setSearchAgentAccount('');
                setSearchIpSubnet('');
                setSelectedResourceType('');
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

        <UserStaticOrderDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          order={selectedOrder}
        />
      </div>
    </>
  );
};

export default UserStaticOrderPage;