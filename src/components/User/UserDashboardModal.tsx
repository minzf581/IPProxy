import React from 'react';
import { Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import StatCard from '@/components/Dashboard/StatCard';
import type { User } from '@/types/user';

interface Props {
  visible: boolean;
  onCancel: () => void;
  user: User | null;
}

interface UserStats {
  title: string;
  value: number;
  icon: string; // Add icon property
}

interface UserOrder {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

const UserDashboardModal: React.FC<Props> = ({
  visible,
  onCancel,
  user,
}) => {
  // 模拟数据
  const stats: UserStats[] = [
    { title: '总订单数', value: 50, icon: 'icon1' }, // Add icon
    { title: '本月订单数', value: 10, icon: 'icon2' }, // Add icon
    { title: '总消费金额', value: 5000, icon: 'icon3' }, // Add icon
    { title: '本月消费金额', value: 1000, icon: 'icon4' }, // Add icon
  ];

  const columns: ColumnsType<UserOrder> = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
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
  ];

  const recentOrders: UserOrder[] = [
    {
      id: 'ORDER001',
      type: '静态IP',
      amount: 500,
      status: '已完成',
      createdAt: '2024-01-01',
    },
    // 更多订单...
  ];

  return (
    <Modal
      title={`${user?.account || '用户'} 的仪表盘`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">最近订单</h3>
        <Table
          columns={columns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
        />
      </div>
    </Modal>
  );
};

export default UserDashboardModal;