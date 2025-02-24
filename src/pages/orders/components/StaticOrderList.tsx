import React, { useEffect, useState } from 'react';
import { Table, Card, Space, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getStaticOrderList } from '@/services/orderService';
import type { StaticOrder } from '@/types/order';
import { formatMoney } from '@/utils/format';

const StaticOrderList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<StaticOrder[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getStaticOrderList({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setOrders(response.list);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error: any) {
      message.error(error.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [pagination.current, pagination.pageSize]);

  const columns: ColumnsType<StaticOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatMoney(amount),
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
          <Button type="link">查看详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="静态订单列表">
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => {
          setPagination(prev => ({
            ...prev,
            current: newPagination.current || 1,
            pageSize: newPagination.pageSize || 10
          }));
        }}
      />
    </Card>
  );
};

export default StaticOrderList;
