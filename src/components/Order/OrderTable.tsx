import React, { useState } from 'react';
import { Table, Tag, Button, Space, Input, DatePicker, Select, Form } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import type { AgentOrder, UserOrder } from '@/types/order';
import { OrderStatus, OrderStatusColors, OrderStatusTexts } from '@/types/order';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface OrderTableProps {
  loading: boolean;
  data: (AgentOrder | UserOrder)[];
  pagination: TablePaginationConfig;
  onTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => void;
  onSearch: (values: any) => void;
  onReset: () => void;
  showAgent?: boolean;
  showUser?: boolean;
  extraColumns?: any[];
  extraActions?: (record: AgentOrder | UserOrder) => React.ReactNode;
}

const OrderTable: React.FC<OrderTableProps> = ({
  loading,
  data,
  pagination,
  onTableChange,
  onSearch,
  onReset,
  showAgent = false,
  showUser = false,
  extraColumns = [],
  extraActions
}) => {
  const [form] = Form.useForm();
  const [searchExpand, setSearchExpand] = useState(false);

  const baseColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'dynamic' ? 'blue' : 'green'}>
          {type === 'dynamic' ? '动态IP' : '静态IP'}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => (
        <Tag color={OrderStatusColors[status]}>
          {OrderStatusTexts[status]}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: true,
    },
    {
      title: '到期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
      width: 180,
    },
  ];

  // 添加代理商列
  if (showAgent) {
    baseColumns.splice(1, 0, {
      title: '代理商',
      dataIndex: ['agent', 'account'],
      key: 'agent',
      width: 120,
    });
  }

  // 添加用户列
  if (showUser) {
    baseColumns.splice(1, 0, {
      title: '用户',
      dataIndex: ['user', 'account'],
      key: 'user',
      width: 120,
    });
  }

  // 添加操作列
  if (extraActions) {
    baseColumns.push({
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (record: AgentOrder | UserOrder) => extraActions(record),
    });
  }

  // 合并额外的列
  const columns = [...baseColumns, ...extraColumns];

  return (
    <div className="bg-white p-4 rounded shadow">
      <Form
        form={form}
        className="mb-4"
        onFinish={onSearch}
      >
        <div className={`grid ${searchExpand ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
          <Form.Item name="orderNo" label="订单号">
            <Input placeholder="请输入订单号" allowClear />
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear>
              {Object.entries(OrderStatusTexts).map(([key, text]) => (
                <Option key={key} value={key}>{text}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型" allowClear>
              <Option value="dynamic">动态IP</Option>
              <Option value="static">静态IP</Option>
            </Select>
          </Form.Item>

          {searchExpand && (
            <Form.Item name="dateRange" label="创建时间">
              <RangePicker showTime />
            </Form.Item>
          )}

          <Form.Item className="flex justify-end">
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                搜索
              </Button>
              <Button icon={<SyncOutlined />} onClick={() => {
                form.resetFields();
                onReset();
              }}>
                重置
              </Button>
              <Button type="link" onClick={() => setSearchExpand(!searchExpand)}>
                {searchExpand ? '收起' : '展开'} {searchExpand ? '↑' : '↓'}
              </Button>
            </Space>
          </Form.Item>
        </div>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
        scroll={{ x: 1300 }}
        rowKey="id"
      />
    </div>
  );
};

export default OrderTable;
