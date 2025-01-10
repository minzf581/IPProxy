import React from 'react';
import { Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import StatCard from '@/components/Dashboard/StatCard';
import type { Agent } from '@/types/agent';

interface Props {
  visible: boolean;
  onCancel: () => void;
  agent: Agent | null;
}

interface AgentStats {
  title: string;
  value: number;
  icon: string; // Add icon property
}

interface AgentOrder {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

const AgentDashboardModal: React.FC<Props> = ({
  visible,
  onCancel,
  agent,
}) => {
  // 模拟数据
  const stats: AgentStats[] = [
    { title: '总订单数', value: 100, icon: 'icon1' }, // Add icon
    { title: '本月订单数', value: 30, icon: 'icon2' }, // Add icon
    { title: '总消费金额', value: 10000, icon: 'icon3' }, // Add icon
    { title: '本月消费金额', value: 3000, icon: 'icon4' }, // Add icon
    { title: '静态IP数量', value: 50, icon: 'icon5' }, // Add icon
    { title: '动态IP数量', value: 200, icon: 'icon6' }, // Add icon
  ];

  const columns: ColumnsType<AgentOrder> = [
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

  const recentOrders: AgentOrder[] = [
    {
      id: 'ORDER001',
      type: '静态IP',
      amount: 1000,
      status: '已完成',
      createdAt: '2024-01-01',
    },
    // 更多订单...
  ];

  return (
    <Modal
      title={`${agent?.account || '代理商'} 的仪表盘`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
    >
      <div className="p-4">
        <div className="grid grid-cols-6 gap-4 mb-6">
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
      </div>
    </Modal>
  );
};

export default AgentDashboardModal;