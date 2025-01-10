import React, { useState } from 'react';
import { Table, Input, Select, Button, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface UserData {
  id: number;
  account: string;
  agent: string;
  remark: string;
  status: 'normal' | 'disabled';
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const columns: ColumnsType<UserData> = [
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
      dataIndex: 'agent',
      key: 'agent',
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
        <Tag color={status === 'normal' ? 'success' : 'error'}>
          {status === 'normal' ? '正常' : '禁用'}
        </Tag>
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
      render: (_, record) => (
        <Space size="middle">
          <Button type="link">修改密码</Button>
          <Button type="link">查看仪表盘</Button>
          <Button type="link" danger={record.status === 'normal'}>
            {record.status === 'normal' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const data: UserData[] = [
    {
      id: 1,
      account: 'user001',
      agent: '代理商1',
      remark: '测试用户1',
      status: 'normal',
      createdAt: '2023-12-28 12:00:00',
    },
    {
      id: 2,
      account: 'user002',
      agent: '代理商2',
      remark: '测试用户2',
      status: 'disabled',
      createdAt: '2023-12-28 13:00:00',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Search
            placeholder="请输入用户账号"
            style={{ width: 200 }}
            onSearch={(value) => console.log(value)}
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => setSelectedAgent(value)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'agent1', label: '代理商1' },
              { value: 'agent2', label: '代理商2' },
            ]}
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => setSelectedStatus(value)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'normal', label: '正常' },
              { value: 'disabled', label: '禁用' },
            ]}
          />
          <Button type="primary">查询</Button>
          <Button>重置</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          total: 100,
          pageSize: 10,
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default UserManagement;
