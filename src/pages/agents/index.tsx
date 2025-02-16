import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, message, Card, Divider } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import type { ColumnType } from 'antd/es/table';
import { getAgentList, updateAgent, updateAgentStatus } from '@/services/agentService';
import { debug } from '@/utils/debug';
import UpdatePasswordModal from '@/components/Agent/UpdatePasswordModal';
import UpdateBalanceModal from '@/components/Agent/UpdateBalanceModal';
import CreateAgentModal from '@/components/Agent/CreateAgentModal';
import type { AgentInfo } from '@/types/agent';
import dayjs from 'dayjs';
import './index.less';
import { PlusOutlined } from '@ant-design/icons';
import UpdateRemarkModal from '@/components/Agent/UpdateRemarkModal';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { Search } = Input;
const { dashboard: debugAgent } = debug;

interface SearchParams {
  page: number;
  pageSize: number;
  account?: string;
  status?: string;
}

const AgentListPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [agents, setAgents] = React.useState<AgentInfo[]>([]);
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedAgent, setSelectedAgent] = React.useState<AgentInfo | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = React.useState(false);
  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [remarkModalVisible, setRemarkModalVisible] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    loadAgents();
  }, [pagination.current, pagination.pageSize]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      console.log('开始加载代理商列表');
      const response = await getAgentList({
        page: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
        status: form.getFieldValue('status')
      });
      
      console.log('代理商列表响应:', response);
      
      if (response.code === 0 && response.data) {
        setAgents(response.data.list);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      } else {
        message.error(response.msg || '获取代理商列表失败');
      }
    } catch (error) {
      console.error('加载代理商列表失败:', error);
      message.error('获取代理商列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (agent: AgentInfo) => {
    try {
      await updateAgentStatus(agent.id, agent.status);
      message.success('状态更新成功');
      loadAgents();
    } catch (error) {
      console.error('更新代理商状态失败:', error);
      message.error('状态更新失败');
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
    form.resetFields();
    setPagination(prev => ({ ...prev, current: 1 }));
    loadAgents();
  };

  const handleViewDashboard = (agent: AgentInfo) => {
    navigate(`/dashboard?agentId=${agent.id}`);
  };

  const columns: ColumnType<AgentInfo>[] = [
    {
      title: '代理商ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
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
      render: (status: string, record: AgentInfo) => (
        <Select
          value={status === 'active' ? 1 : 0}
          style={{ width: 100 }}
          onChange={(value: number) => handleUpdateStatus({ 
            ...record, 
            status: value === 1 ? 'active' : 'disabled' 
          })}
        >
          <Option value={1}>正常</Option>
          <Option value={0}>禁用</Option>
        </Select>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: AgentInfo) => (
        <Space size="middle">
          <Button type="link" onClick={() => {
            setSelectedAgent(record);
            setBalanceModalVisible(true);
          }}>
            调整额度
          </Button>
          <Button type="link" onClick={() => {
            setSelectedAgent(record);
            setPasswordModalVisible(true);
          }}>
            修改密码
          </Button>
          <Button type="link" onClick={() => {
            setSelectedAgent(record);
            setRemarkModalVisible(true);
          }}>
            修改备注
          </Button>
          <Button type="link" onClick={() => handleViewDashboard(record)}>
            查看仪表盘
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="agentListPage">
      <Card className="searchCard">
        <Form form={form} layout="inline">
          <Space>
            <Form.Item name="account">
              <Search
                placeholder="请输入代理商账户"
                style={{ width: 200 }}
                onSearch={handleSearch}
              />
            </Form.Item>
            <Form.Item name="status">
              <Select
                placeholder="全部"
                style={{ width: 120 }}
                allowClear
                onChange={() => handleSearch()}
              >
                <Option value="active">正常</Option>
                <Option value="disabled">禁用</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleSearch}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Form.Item>
          </Space>
        </Form>
        <Button 
          type="primary" 
          onClick={() => setCreateModalVisible(true)}
          icon={<PlusOutlined />}
        >
          新增代理商
        </Button>
      </Card>

      <Card className="tableCard">
        <Table
          className="agentTable"
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSize: 10,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
        />
      </Card>

      <CreateAgentModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={loadAgents}
      />

      {selectedAgent && (
        <>
          <UpdatePasswordModal
            visible={passwordModalVisible}
            agentId={Number(selectedAgent.id)}
            onClose={() => {
              setPasswordModalVisible(false);
              setSelectedAgent(null);
            }}
          />
          <UpdateBalanceModal
            visible={balanceModalVisible}
            agentId={Number(selectedAgent.id)}
            currentBalance={selectedAgent.balance}
            onClose={() => {
              setBalanceModalVisible(false);
              setSelectedAgent(null);
              loadAgents();
            }}
          />
          <UpdateRemarkModal
            visible={remarkModalVisible}
            agent={{
              id: Number(selectedAgent.id),
              remark: selectedAgent.remark
            }}
            onClose={() => {
              setRemarkModalVisible(false);
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
