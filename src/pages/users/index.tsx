import React from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import { getUserList, updateUser } from '@/services/userService';
import { isAdmin } from '@/services/mainUser';
import UpdatePasswordModal from '@/components/User/UpdatePasswordModal';
import type { UserInfo } from '@/types/user';
import dayjs from 'dayjs';

const UserListPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ list: UserInfo[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });
  const [selectedUser, setSelectedUser] = React.useState<UserInfo | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);

  React.useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await getUserList({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (user: UserInfo, newStatus: string) => {
    try {
      await updateUser(user.id, { status: newStatus });
      message.success('状态更新成功');
      loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      message.error('更新用户状态失败');
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: UserInfo) => (
        <Space>
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
    <Card title="用户管理">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            setSelectedUser(null);
            setPasswordModalVisible(true);
          }}
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
        onChange={handleTableChange}
      />

      {selectedUser && (
        <UpdatePasswordModal
          visible={passwordModalVisible}
          userId={selectedUser.id}
          onClose={() => {
            setPasswordModalVisible(false);
            setSelectedUser(null);
          }}
        />
      )}
    </Card>
  );
};

export default UserListPage;
