import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Space } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import OrderTable from '@/components/Order/OrderTable';
import type { AgentOrder } from '@/types/order';
import { OrderStatus } from '@/types/order';
import ipProxyAPI from '@/utils/ipProxyAPI';
import { copyToClipboard } from '@/utils/clipboard';

const AgentOrderPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({});

  // 获取订单列表
  const fetchOrders = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    params = searchParams
  ) => {
    try {
      setLoading(true);
      const response = await ipProxyAPI.getAgentOrders({
        page,
        pageSize,
        ...params,
      });

      setOrders(response.list);
      setPagination({
        ...pagination,
        current: page,
        total: response.total,
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 处理表格变化
  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => {
    fetchOrders(newPagination.current, newPagination.pageSize, {
      ...searchParams,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  // 处理搜索
  const handleSearch = (values: any) => {
    const params = {
      ...values,
      startTime: values.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      endTime: values.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    };
    delete params.dateRange;
    setSearchParams(params);
    fetchOrders(1, pagination.pageSize, params);
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({});
    fetchOrders(1, pagination.pageSize, {});
  };

  // 复制代理地址
  const handleCopyProxy = async (order: AgentOrder) => {
    const proxyAddress = `${order.protocol}://${order.username}:${order.password}@${order.proxyHost}:${order.proxyPort}`;
    if (await copyToClipboard(proxyAddress)) {
      message.success('代理地址已复制到剪贴板');
    }
  };

  // 取消订单
  const handleCancelOrder = (order: AgentOrder) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '确定要取消该订单吗？取消后将无法恢复。',
      onOk: async () => {
        try {
          await ipProxyAPI.cancelOrder(order.id);
          message.success('订单已取消');
          fetchOrders();
        } catch (error) {
          console.error('取消订单失败:', error);
          message.error('取消订单失败');
        }
      },
    });
  };

  // 额外的操作列
  const extraActions = (record: AgentOrder) => (
    <Space size="middle">
      {record.status === OrderStatus.ACTIVE && (
        <Button
          type="link"
          icon={<CopyOutlined />}
          onClick={() => handleCopyProxy(record)}
        >
          复制
        </Button>
      )}
      {record.status === OrderStatus.PENDING && (
        <Button
          type="link"
          danger
          onClick={() => handleCancelOrder(record)}
        >
          取消
        </Button>
      )}
    </Space>
  );

  // 额外的列
  const extraColumns = [
    {
      title: '用户',
      dataIndex: ['user', 'account'],
      key: 'user',
      width: 120,
    },
    {
      title: '代理信息',
      dataIndex: 'proxyHost',
      key: 'proxyHost',
      width: 200,
      render: (_: any, record: AgentOrder) => (
        <div>
          <div>地址：{record.proxyHost}</div>
          {record.ipSubnet && <div>子网：{record.ipSubnet}</div>}
          <div>协议：{record.protocol}</div>
        </div>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
    },
  ];

  return (
    <div className="p-6">
      <OrderTable
        loading={loading}
        data={orders}
        pagination={pagination}
        onTableChange={handleTableChange}
        onSearch={handleSearch}
        onReset={handleReset}
        showAgent={true}
        extraColumns={extraColumns}
        extraActions={extraActions}
      />
    </div>
  );
};

export default AgentOrderPage;
