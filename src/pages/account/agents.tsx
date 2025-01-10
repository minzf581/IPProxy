import React, { useState } from 'react';
import { Table, Input, Select, Button, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface AgentData {
  id: number;
  account: string;
  agent: string;
  balance: number;
  status: 'normal' | 'disabled';
  createdAt: string;
}

const AgentManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const columns: ColumnsType<AgentData> = [
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
          <Button type="link">充注</Button>
          <Button type="link">调整额度</Button>
          <Button type="link">修改密码</Button>
          <Button type="link">查看仪表盘</Button>
          <Button type="link" danger={record.status === 'normal'}>
            {record.status === 'normal' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const data: AgentData[] = [
    {
      id: 1,
      account: 'user001',
      agent: '代理商1',
      balance: 1000.00,
      status: 'normal',
      createdAt: '2023-12-28 12:00:00',
    },
    {
      id: 2,
      account: 'user002',
      agent: '代理商2',
      balance: 500.00,
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
        <Button type="primary">+ 新增代理商</Button>
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

export default AgentManagement;
