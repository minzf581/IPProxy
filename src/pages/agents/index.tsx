import React from 'react';
import { Card, Table, Button, Space, Tag, message, Input, Select } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { getAgentList, updateAgent } from '@/services/agentService';
import { fetchMainUser } from '@/services/mainUser';
import UpdatePasswordModal from '@/components/Agent/UpdatePasswordModal';
import UpdateBalanceModal from '@/components/Agent/UpdateBalanceModal';
import type { AgentInfo } from '@/types/agent';
import dayjs from 'dayjs';

const { Search } = Input;

interface SearchParams {
  page: number;
  pageSize: number;
  account?: string;
  status?: string;
}

const AgentListPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ list: AgentInfo[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedAgent, setSelectedAgent] = React.useState<AgentInfo | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = React.useState(false);
  const [searchAccount, setSearchAccount] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    checkAdminStatus();
    loadAgents();
  }, [pagination.current, pagination.pageSize]);

  const checkAdminStatus = async () => {
    try {
      const user = await fetchMainUser();
      setIsAdmin(user?.role === 'admin');
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const params: SearchParams = {
        page: Number(pagination.current) || 1,
        pageSize: Number(pagination.pageSize) || 10
      };
      
      if (searchAccount) {
        params.account = searchAccount;
      }
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      
      const result = await getAgentList(params);
      setData(result);
      setPagination(prev => ({
        ...prev,
        total: result.total
      }));
    } catch (error) {
      console.error('Failed to load agents:', error);
      message.error('加载代理商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (agent: AgentInfo) => {
    try {
      const newStatus = agent.status === 'active' ? 'disabled' : 'active';
      await updateAgent(agent.id, { status: newStatus });
      message.success('状态更新成功');
      loadAgents();
    } catch (error) {
      console.error('Failed to update agent status:', error);
      message.error('更新代理商状态失败');
    }
  };

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => {
    setPagination(newPagination);
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadAgents();
  };

  const handleReset = () => {
    setSearchAccount('');
    setSelectedStatus('all');
    setPagination(prev => ({ ...prev, current: 1 }));
    loadAgents();
  };

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
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
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
      render: (_: unknown, record: AgentInfo) => (
        <Space size="middle">
          <Button type="link">充注</Button>
          <Button type="link">调整额度</Button>
          <Button type="link" onClick={() => {
            setSelectedAgent(record);
            setPasswordModalVisible(true);
          }}>修改密码</Button>
          <Button type="link">查看仪表盘</Button>
          <Button 
            type="link" 
            danger={record.status === 'active'}
            onClick={() => handleUpdateStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  if (!isAdmin) {
    return <div>无权访问</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="请输入用户账号"
            style={{ width: 200 }}
            value={searchAccount}
            onChange={e => setSearchAccount(e.target.value)}
            onSearch={handleSearch}
          />
          <Select
            value={selectedStatus}
            style={{ width: 120 }}
            onChange={value => setSelectedStatus(value)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'active', label: '正常' },
              { value: 'disabled', label: '禁用' },
            ]}
          />
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        <Button type="primary" onClick={() => {
          setSelectedAgent(null);
          setPasswordModalVisible(true);
        }}>+ 新增代理商</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data.list}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
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
    </div>
  );
};

export default AgentListPage;
