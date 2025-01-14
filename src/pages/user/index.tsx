import React, { useState } from 'react';
import { Card, Table, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: ColumnsType<User> = [
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
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理">
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
      />
    </Card>
  );
};

export default UserPage;