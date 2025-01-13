import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message } from 'antd';
import { getUserList, updateUser } from '@/services/userService';
import type { UserInfo } from '@/types/user';
import CreateUserModal from '@/components/User/CreateUserModal';
import UpdateUserModal from '@/components/User/UpdateUserModal';
import UpdatePasswordModal from '@/components/User/UpdatePasswordModal';
import UpdateBalanceModal from '@/components/User/UpdateBalanceModal';

const UsersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ list: UserInfo[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { page, pageSize } = pagination;
      const result = await getUserList({ page, pageSize });
      setData(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (user: UserInfo) => {
    try {
      await updateUser(user.id, { 
        status: user.status === 'active' ? 'disabled' : 'active' 
      });
      message.success('状态更新成功');
      loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      message.error('更新用户状态失败');
    }
  };

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
      title: '操作',
      key: 'action',
      render: (_: any, record: UserInfo) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setUpdateModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setPasswordModalVisible(true);
            }}
          >
            修改密码
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setBalanceModalVisible(true);
            }}
          >
            修改余额
          </Button>
          <Button
            size="small"
            danger={record.status === 'active'}
            type={record.status === 'active' ? 'primary' : 'default'}
            onClick={() => handleUpdateStatus(record)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => setCreateModalVisible(true)}
        >
          添加用户
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
        onChange={(pagination) => setPagination(pagination)}
      />

      <CreateUserModal
        visible={createModalVisible}
        onClose={() => {
          setCreateModalVisible(false);
          loadUsers();
        }}
      />

      {selectedUser && (
        <>
          <UpdateUserModal
            visible={updateModalVisible}
            user={selectedUser}
            onClose={() => {
              setUpdateModalVisible(false);
              setSelectedUser(null);
              loadUsers();
            }}
          />

          <UpdatePasswordModal
            visible={passwordModalVisible}
            userId={selectedUser.id}
            onClose={() => {
              setPasswordModalVisible(false);
              setSelectedUser(null);
            }}
          />

          <UpdateBalanceModal
            visible={balanceModalVisible}
            user={selectedUser}
            onClose={() => {
              setBalanceModalVisible(false);
              setSelectedUser(null);
              loadUsers();
            }}
          />
        </>
      )}
    </div>
  );
};

export default UsersPage;
