import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import UpdatePasswordModal from '@/components/User/UpdatePasswordModal';
import UserDashboardModal from '@/components/User/UserDashboardModal';
import type { User } from '@/types/user';

const { Option } = Select;

const UserPage: React.FC = () => {
  const [searchAccount, setSearchAccount] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [dashboardModalVisible, setDashboardModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 模拟数据，实际应从API获取
  const agents = [
    { id: '1', name: '代理商1' },
    { id: '2', name: '代理商2' },
  ];

  const users: User[] = [
    {
      id: '1',
      account: 'user001',
      agentId: '1',
      agentName: '代理商1',
      status: 'active',
      createdAt: '2023-12-28 12:00:00',
      remark: '测试用户1',
    },
    {
      id: '2',
      account: 'user002',
      agentId: '2',
      agentName: '代理商2',
      status: 'disabled',
      createdAt: '2023-12-28 13:00:00',
      remark: '测试用户2',
    },
  ];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: '所属代理商',
      dataIndex: 'agentName',
      key: 'agentName',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'active' ? 'text-green-500' : 'text-red-500'}>
          {status === 'active' ? '正常' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleUpdatePassword(record)}>
            修改密码
          </Button>
          <Button type="link" onClick={() => handleViewDashboard(record)}>
            查看仪表盘
          </Button>
          <Button
            type="link"
            danger={record.status === 'active'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = () => {
    // TODO: 实现搜索逻辑
    message.info('搜索功能待实现');
  };

  const handleUpdatePassword = (user: User) => {
    setSelectedUser(user);
    setPasswordModalVisible(true);
  };

  const handleViewDashboard = (user: User) => {
    setSelectedUser(user);
    setDashboardModalVisible(true);
  };

  const handleToggleStatus = (user: User) => {
    // TODO: 实现状态切换逻辑
    message.info('状态切换功能待实现');
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <Space>
            <Input
              placeholder="请输入用户账号"
              value={searchAccount}
              onChange={e => setSearchAccount(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="所属代理商"
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
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button
              onClick={() => {
                setSearchAccount('');
                setSelectedAgent('');
                setStatus('');
              }}
            >
              重置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{
            total: 100,
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
          }}
        />

        <UpdatePasswordModal
          visible={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          user={selectedUser}
        />

        <UserDashboardModal
          visible={dashboardModalVisible}
          onCancel={() => setDashboardModalVisible(false)}
          user={selectedUser}
        />
      </div>
    </>
  );
};

export default UserPage;