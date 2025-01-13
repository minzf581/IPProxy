import React from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import { getAgentList, updateAgent } from '@/services/agentService';
import { isAdmin } from '@/services/mainUser';
import UpdatePasswordModal from '@/components/Agent/UpdatePasswordModal';
import UpdateBalanceModal from '@/components/Agent/UpdateBalanceModal';
import type { AgentInfo } from '@/types/agent';
import dayjs from 'dayjs';

const AgentListPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ list: AgentInfo[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });
  const [selectedAgent, setSelectedAgent] = React.useState<AgentInfo | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = React.useState(false);

  React.useEffect(() => {
    loadAgents();
  }, [pagination.current, pagination.pageSize]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const result = await getAgentList({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load agents:', error);
      message.error('加载代理商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (agent: AgentInfo, newStatus: string) => {
    try {
      await updateAgent(agent.id, { status: newStatus });
      message.success('状态更新成功');
      loadAgents();
    } catch (error) {
      console.error('Failed to update agent status:', error);
      message.error('更新代理商状态失败');
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: '代理商名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: AgentInfo) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedAgent(record);
              setPasswordModalVisible(true);
            }}
          >
            修改密码
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedAgent(record);
              setBalanceModalVisible(true);
            }}
          >
            修改余额
          </Button>
          <Button
            size="small"
            type={record.status === 'active' ? 'default' : 'primary'}
            onClick={() => handleUpdateStatus(record, record.status === 'active' ? 'disabled' : 'active')}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  if (!isAdmin()) {
    return <div>无权访问</div>;
  }

  return (
    <Card title="代理商管理">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            setSelectedAgent(null);
            setPasswordModalVisible(true);
          }}
        >
          添加代理商
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data.list}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total: data.total,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
      />

      {selectedAgent && (
        <>
          <UpdatePasswordModal
            visible={passwordModalVisible}
            agentId={selectedAgent.id}
            onClose={() => {
              setPasswordModalVisible(false);
              setSelectedAgent(null);
            }}
          />
          <UpdateBalanceModal
            visible={balanceModalVisible}
            agentId={selectedAgent.id}
            currentBalance={selectedAgent.balance}
            onClose={() => {
              setBalanceModalVisible(false);
              setSelectedAgent(null);
              loadAgents();
            }}
          />
        </>
      )}
    </Card>
  );
};

export default AgentListPage;
