import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  Button,
  Table,
  Space,
  message,
  Modal
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
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
  createTime: string;
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: OrderData) => (
        <Space size="middle">
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
        createTime: dayjs().subtract(index, 'hour').format('YYYY-MM-DD HH:mm:ss'),
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
          <Form.Item name="agentId">
            <Input
              placeholder="请输入代理商账号"
              allowClear
              style={{ width: 200 }}
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
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentOrder && (
          <div>
            <p>订单号：{currentOrder.orderNo}</p>
            <p>代理商：{currentOrder.agentId}</p>
            <p>金额：¥{currentOrder.amount.toFixed(2)}</p>
            <p>创建时间：{currentOrder.createTime}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentOrders; 