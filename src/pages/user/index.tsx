import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Select, message, Modal, Spin, Form } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import UpdatePasswordModal from '@/components/User/UpdatePasswordModal';
import UserDashboardModal from '@/components/User/UserDashboardModal';
import type { UserInfo } from '@/utils/ipProxyAPI';
import ipProxyAPI from '@/utils/ipProxyAPI';

const { Option } = Select;

interface AgentOption {
  id: string;
  name: string;
}

const UserPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchAccount, setSearchAccount] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [dashboardModalVisible, setDashboardModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取代理商列表
  const fetchAgents = async () => {
    try {
      const response = await ipProxyAPI.getAgentList({
        page: 1,
        pageSize: 100,  // 假设代理商数量不会太多
        status: 'active'
      });
      setAgents(response.list.map(agent => ({
        id: agent.id,
        name: agent.name
      })));
    } catch (error) {
      console.error('获取代理商列表失败:', error);
      message.error('获取代理商列表失败');
    }
  };

  // 获取用户列表
  const fetchUsers = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const response = await ipProxyAPI.getUserList({
        page,
        pageSize,
        searchAccount,
        agentId: selectedAgent,
        status
      });

      setUsers(response.list);
      setPagination({
        ...pagination,
        current: page,
        total: response.total
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchAgents();
    fetchUsers(1);
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchUsers(1);
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setSearchAccount('');
    setSelectedAgent('');
    setStatus('');
    fetchUsers(1);
  };

  // 处理修改密码
  const handleUpdatePassword = async (user: UserInfo) => {
    setSelectedUser(user);
    setPasswordModalVisible(true);
  };

  // 处理查看仪表盘
  const handleViewDashboard = async (user: UserInfo) => {
    setSelectedUser(user);
    setDashboardModalVisible(true);
  };

  // 处理状态切换
  const handleToggleStatus = async (user: UserInfo) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '停用';

    Modal.confirm({
      title: `确认${actionText}用户`,
      content: `确定要${actionText}用户 ${user.account} 吗？`,
      onOk: async () => {
        try {
          await ipProxyAPI.updateUserStatus(user.id, newStatus);
          message.success(`${actionText}成功`);
          fetchUsers();
        } catch (error) {
          console.error(`${actionText}用户失败:`, error);
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
      render: (_: any, record: UserInfo) => (
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
          <Form.Item label="代理商">
            <Select
              style={{ width: 200 }}
              placeholder="请选择代理商"
              value={selectedAgent}
              onChange={setSelectedAgent}
              allowClear
            >
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>{agent.name}</Option>
              ))}
            </Select>
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
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => fetchUsers(page, pageSize),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`
          }}
        />
      </div>

      {selectedUser && (
        <>
          <UpdatePasswordModal
            visible={passwordModalVisible}
            user={selectedUser}
            onCancel={() => setPasswordModalVisible(false)}
            onSuccess={() => {
              setPasswordModalVisible(false);
              message.success('密码修改成功');
            }}
          />
          <UserDashboardModal
            visible={dashboardModalVisible}
            user={selectedUser}
            onCancel={() => setDashboardModalVisible(false)}
          />
        </>
      )}
    </div>
  );
};

export default UserPage;