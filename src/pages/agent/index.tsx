import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Select, message, Modal, Form, Spin } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import UpdatePasswordModal from '@/components/Agent/UpdatePasswordModal';
import AgentDashboardModal from '@/components/Agent/AgentDashboardModal';
import type { AgentInfo } from '@/utils/ipProxyAPI';
import ipProxyAPI from '@/utils/ipProxyAPI';

const { Option } = Select;

const AgentPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchAccount, setSearchAccount] = useState('');
  const [status, setStatus] = useState<string>('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [dashboardModalVisible, setDashboardModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取代理商列表
  const fetchAgents = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const response = await ipProxyAPI.getAgentList({
        page,
        pageSize,
        searchAccount,
        status
      });

      setAgents(response.list);
      setPagination({
        ...pagination,
        current: page,
        total: response.total
      });
    } catch (error) {
      console.error('获取代理商列表失败:', error);
      message.error('获取代理商列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchAgents(1);
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchAgents(1);
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setSearchAccount('');
    setStatus('');
    fetchAgents(1);
  };

  // 处理修改密码
  const handleUpdatePassword = async (agent: AgentInfo) => {
    setSelectedAgent(agent);
    setPasswordModalVisible(true);
  };

  // 处理查看仪表盘
  const handleViewDashboard = async (agent: AgentInfo) => {
    setSelectedAgent(agent);
    setDashboardModalVisible(true);
  };

  // 处理状态切换
  const handleToggleStatus = async (agent: AgentInfo) => {
    const newStatus = agent.status === 'active' ? 'disabled' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '停用';

    Modal.confirm({
      title: `确认${actionText}代理商`,
      content: `确定要${actionText}代理商 ${agent.account} 吗？`,
      onOk: async () => {
        try {
          await ipProxyAPI.updateAgentStatus(agent.id, newStatus);
          message.success(`${actionText}成功`);
          fetchAgents();
        } catch (error) {
          console.error(`${actionText}代理商失败:`, error);
          message.error(`${actionText}失败`);
        }
      }
    });
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
      title: '名称',
      dataIndex: 'name',
      key: 'name',
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
      render: (_: any, record: AgentInfo) => (
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

  return (
    <div className="p-6">
      <div className="mb-4 bg-white p-4 rounded shadow">
        <Form form={form} layout="inline">
          <Form.Item label="账号">
            <Input
              placeholder="请输入账号"
              value={searchAccount}
              onChange={e => setSearchAccount(e.target.value)}
              allowClear
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              style={{ width: 120 }}
              placeholder="请选择状态"
              value={status}
              onChange={setStatus}
              allowClear
            >
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<SyncOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => fetchAgents(page, pageSize),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`
          }}
        />
      </div>

      {selectedAgent && (
        <>
          <UpdatePasswordModal
            visible={passwordModalVisible}
            agent={selectedAgent}
            onCancel={() => setPasswordModalVisible(false)}
            onSuccess={() => {
              setPasswordModalVisible(false);
              message.success('密码修改成功');
            }}
          />
          <AgentDashboardModal
            visible={dashboardModalVisible}
            agent={selectedAgent}
            onCancel={() => setDashboardModalVisible(false)}
          />
        </>
      )}
    </div>
  );
};

export default AgentPage;