import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  message,
  Modal
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface OrderData {
  id: string;
  orderNo: string;
  agentId: string;
  amount: number;
  status: 'pending' | 'paid';
  createTime: string;
  payTime?: string;
}

const AgentOrders: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);

  // 表格列配置
  const columns: ColumnsType<OrderData> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      fixed: 'left',
    },
    {
      title: '代理商',
      dataIndex: 'agentId',
      key: 'agentId',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'pending' | 'paid') => (
        <Tag color={status === 'paid' ? 'success' : 'warning'}>
          {status === 'paid' ? '已支付' : '待支付'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '支付时间',
      dataIndex: 'payTime',
      key: 'payTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: OrderData) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmPayment(record.orderNo)}
            >
              确认支付
            </Button>
          )}
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<OrderData>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    fetchData({
      pageSize: pagination.pageSize,
      current: pagination.current,
      ...form.getFieldsValue(),
    });
  };

  // 获取数据
  const fetchData = async (params: any) => {
    setLoading(true);
    try {
      // TODO: 替换为实际的API调用
      const response = await fetch('/api/agent-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      // 模拟数据
      const mockData: OrderData[] = Array(10).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        orderNo: `DD${dayjs().format('YYYYMMDD')}${String(index + 1).padStart(6, '0')}`,
        agentId: `agent${index + 1}`,
        amount: Math.floor(Math.random() * 10000) / 100,
        status: Math.random() > 0.5 ? 'paid' : 'pending',
        createTime: dayjs().subtract(index, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        payTime: Math.random() > 0.5 ? dayjs().subtract(index, 'hour').add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
      }));
      
      setData(mockData);
      setPagination({
        ...pagination,
        total: 100,
      });
    } catch (error) {
      message.error('获取数据失败');
    }
    setLoading(false);
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData({
      ...form.getFieldsValue(),
      current: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchData({
      current: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 确认支付
  const handleConfirmPayment = async (orderNo: string) => {
    try {
      // TODO: 替换为实际的API调用
      await fetch(`/api/agent-orders/${orderNo}/confirm`, {
        method: 'POST',
      });
      message.success('支付确认成功');
      handleSearch();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 查看详情
  const handleViewDetails = (order: OrderData) => {
    setCurrentOrder(order);
    setDetailVisible(true);
  };

  // 初始化加载数据
  React.useEffect(() => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, []);

  return (
    <div className={styles.agentOrders}>
      <Card bordered={false}>
        <Form
          form={form}
          layout="inline"
          className={styles.searchForm}
          onFinish={handleSearch}
        >
          <Form.Item name="orderNo">
            <Input
              placeholder="请输入订单号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="agentId">
            <Input
              placeholder="请输入代理商账号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="订单状态"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '待支付', value: 'pending' },
                { label: '已支付', value: 'paid' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker
              style={{ width: 260 }}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="orderNo"
          pagination={{
            ...pagination,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          className={styles.table}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentOrder && (
          <div className={styles.orderDetail}>
            <p><strong>订单号：</strong>{currentOrder.orderNo}</p>
            <p><strong>代理商：</strong>{currentOrder.agentId}</p>
            <p><strong>金额：</strong>¥{currentOrder.amount.toFixed(2)}</p>
            <p><strong>状态：</strong>
              <Tag color={currentOrder.status === 'paid' ? 'success' : 'warning'}>
                {currentOrder.status === 'paid' ? '已支付' : '待支付'}
              </Tag>
            </p>
            <p><strong>创建时间：</strong>{currentOrder.createTime}</p>
            {currentOrder.payTime && (
              <p><strong>支付时间：</strong>{currentOrder.payTime}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentOrders; 