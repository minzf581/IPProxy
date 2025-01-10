import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { Agent, CreateAgentForm } from '@/types/agent';
import CreateAgentModal from '@/components/Agent/CreateAgentModal';
import UpdatePasswordModal from '@/components/Agent/UpdatePasswordModal';
import UpdateBalanceModal from '@/components/Agent/UpdateBalanceModal';
import UpdateRemarkModal from '@/components/Agent/UpdateRemarkModal';
import AgentDashboardModal from '@/components/Agent/AgentDashboardModal';

const { Option } = Select;

const AgentPage: React.FC = () => {
  const [searchAccount, setSearchAccount] = useState('');
  const [status, setStatus] = useState<string>('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [dashboardModalVisible, setDashboardModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
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
      render: (_: any, record: Agent) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleUpdateRemark(record)}>备注</Button>
          <Button type="link" onClick={() => handleUpdateBalance(record)}>调整额度</Button>
          <Button type="link" onClick={() => handleUpdatePassword(record)}>修改密码</Button>
          <Button type="link" onClick={() => handleViewDashboard(record)}>查看仪表盘</Button>
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

  // 模拟数据，实际应从API获取
  const agents: Agent[] = [
    {
      id: '1',
      account: 'user001',
      name: '代理商1',
      balance: 1000.00,
      status: 'active',
      createdAt: '2023-12-28 12:00:00',
    },
    {
      id: '2',
      account: 'user002',
      name: '代理商2',
      balance: 500.00,
      status: 'disabled',
      createdAt: '2023-12-28 13:00:00',
    },
  ];

  const handleSearch = () => {
    // 实现搜索逻辑
    message.info('搜索功能待实现');
  };

  const handleCreateAgent = (values: CreateAgentForm) => {
    // TODO: 调用API创建代理商
    message.success('代理商创建成功');
    setCreateModalVisible(false);
  };

  const handleUpdatePassword = (agent: Agent) => {
    setSelectedAgent(agent);
    setPasswordModalVisible(true);
  };

  const handleUpdateBalance = (agent: Agent) => {
    setSelectedAgent(agent);
    setBalanceModalVisible(true);
  };

  const handleUpdateRemark = (agent: Agent) => {
    setSelectedAgent(agent);
    setRemarkModalVisible(true);
  };

  const handleViewDashboard = (agent: Agent) => {
    setSelectedAgent(agent);
    setDashboardModalVisible(true);
  };

  const handleToggleStatus = (agent: Agent) => {
    // 实现状态切换逻辑
    message.info('状态切换功能待实现');
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-4 flex justify-between">
          <Space>
            <Input
              placeholder="请输入用户账号"
              value={searchAccount}
              onChange={e => setSearchAccount(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
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
            <Button type="primary" onClick={handleSearch}>查询</Button>
            <Button onClick={() => {
              setSearchAccount('');
              setStatus('');
            }}>重置</Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新增代理商
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          pagination={{
            total: 100,
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
          }}
        />
      </div>

      <CreateAgentModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateAgent}
      />

      <UpdatePasswordModal
        visible={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        agent={selectedAgent}
      />

      <UpdateBalanceModal
        visible={balanceModalVisible}
        onCancel={() => setBalanceModalVisible(false)}
        agent={selectedAgent}
      />

      <UpdateRemarkModal
        visible={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        agent={selectedAgent}
      />

      <AgentDashboardModal
        visible={dashboardModalVisible}
        onCancel={() => setDashboardModalVisible(false)}
        agent={selectedAgent}
      />
    </>
  );
};

export default AgentPage; 