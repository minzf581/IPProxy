import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, message } from 'antd';
import { getBalanceHistory } from '@/services/userService';
import type { UserInfo, BalanceRecord } from '@/types/user';
import { formatDateTime } from '@/utils/dateUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: UserInfo;
}

const RechargeRecordModal: React.FC<Props> = ({
  visible,
  onClose,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ list: BalanceRecord[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible, pagination.current, pagination.pageSize]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const result = await getBalanceHistory({
        userId: user.id,
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load recharge records:', error);
      message.error('加载充值记录失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'recharge' ? 'green' : type === 'consume' ? 'red' : 'blue'}>
          {type === 'recharge' ? '充值' : type === 'consume' ? '消费' : '退款'}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  return (
    <Modal
      title={`${user.username} 的余额记录`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
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
    </Modal>
  );
};

export default RechargeRecordModal;
