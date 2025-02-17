import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, Input, Modal, message, Space, Select } from 'antd';
import type { CreateUserParams, User } from '@/types/user';
import { createUser, getUserList, getCurrentUser, getAgentList, searchUsers } from '@/services/userService';
import styles from './index.module.less';

const { TextArea } = Input;

const UserList: React.FC = () => {
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取用户列表
  const fetchUsers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getUserList({
        page,
        pageSize,
        username: form.getFieldValue('searchUsername'),
      });

      if (response.code === 0 && response.data) {
        setUsers(response.data.list);
        setPagination({
          ...pagination,
          current: page,
          pageSize,
          total: response.data.total,
        });
      } else {
        message.error(response.msg || '获取用户列表失败');
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索用户
  const handleSearch = async (values: any) => {
    try {
      setLoading(true);
      const response = await searchUsers(values);
      if (response.code === 0 && response.data) {
        setUsers(response.data.list);
        setPagination({
          ...pagination,
          total: response.data.total
        });
      } else {
        message.error(response.msg || '获取用户列表失败');
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前用户信息和代理商列表
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getCurrentUser();
        setIsAdmin(userInfo.is_admin);
        
        if (userInfo.is_admin) {
          // 如果是管理员，获取代理商列表
          const agentList = await getAgentList();
          setAgents(agentList);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };

    fetchUserInfo();
    // 初始加载用户列表
    handleSearch({});
  }, []);

  // 处理创建用户
  const handleCreateUser = async (values: CreateUserParams) => {
    try {
      setLoading(true);
      const response = await createUser(values);
      if (response.code === 0) {
        message.success('创建用户成功');
        createForm.resetFields();
        // 刷新用户列表
        handleSearch({});
      } else {
        message.error(response.msg || '创建用户失败');
      }
    } catch (error) {
      message.error('创建用户失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表格分页
  const handleTableChange = (newPagination: any) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, []);

  // 搜索表单
  const searchForm = (
    <Form form={form} layout="inline">
      <Form.Item name="searchUsername">
        <Input placeholder="请输入用户账号" id="search-username-input" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={() => fetchUsers(1, pagination.pageSize)}>
          搜索
        </Button>
      </Form.Item>
    </Form>
  );

  // 创建用户表单
  const createUserForm = (
    <Form 
      form={createForm} 
      labelCol={{ span: 6 }} 
      wrapperCol={{ span: 16 }}
      onFinish={handleCreateUser}
    >
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" id="create-username-input" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password placeholder="请输入密码" id="create-password-input" />
      </Form.Item>
      <Form.Item label="邮箱" name="email">
        <Input placeholder="请输入邮箱" id="create-email-input" />
      </Form.Item>
      {isAdmin && (
        <Form.Item name="agent_id">
          <Select
            placeholder="选择代理商"
            style={{ width: 200 }}
            allowClear
            options={agents.map(agent => ({
              label: agent.username,
              value: agent.id
            }))}
          />
        </Form.Item>
      )}
      <Form.Item label="备注" name="remark">
        <TextArea placeholder="请输入备注" id="create-remark-input" />
      </Form.Item>
    </Form>
  );

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
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
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: any) => (
        <Space size="middle">
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.userListContainer}>
      <Card
        title="用户管理"
        extra={
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>
            创建用户
          </Button>
        }
      >
        {searchForm}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal
        title="创建用户"
        open={createModalVisible}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        destroyOnClose
      >
        {createUserForm}
      </Modal>
    </div>
  );
};

export default UserList; 