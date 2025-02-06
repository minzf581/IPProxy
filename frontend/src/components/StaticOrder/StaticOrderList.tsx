import React, { useState } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  message,
  Modal,
  Input,
  Form,
  DatePicker,
  Select,
  Option
} from 'antd';
import { useRequest } from 'ahooks';
import type { StaticOrder } from '@/types/staticOrder';
import {
  getStaticOrders,
  updateStaticOrderStatus
} from '@/services/staticOrder';
import { formatDateTime } from '@/utils/date';

const { RangePicker } = DatePicker;

interface SearchParams {
  status?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}

const StaticOrderList: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    pageSize: 10,
  });
  const [selectedOrder, setSelectedOrder] = useState<StaticOrder | null>(null);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [remark, setRemark] = useState('');

  const { data, loading, refresh } = useRequest(
    () => getStaticOrders(searchParams),
    {
      refreshDeps: [searchParams],
    }
  );

  const { run: updateStatus } = useRequest(updateStaticOrderStatus, {
    manual: true,
    onSuccess: (result) => {
      if (result.code === 0) {
        message.success('状态更新成功');
        refresh();
        setRemarkModalVisible(false);
      } else {
        message.error(result.msg || '状态更新失败');
      }
    },
  });

  const handleSearch = (values: any) => {
    const { dateRange, ...rest } = values;
    const params: SearchParams = {
      ...searchParams,
      ...rest,
      page: 1,
    };
    
    if (dateRange) {
      params.startTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
      params.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
    }
    
    setSearchParams(params);
  };

  const handleTableChange = (pagination: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleUpdateStatus = (record: StaticOrder, status: string) => {
    if (status === 'cancelled') {
      setSelectedOrder(record);
      setRemarkModalVisible(true);
    } else {
      updateStatus(record.orderNo, status);
    }
  };

  const handleRemarkSubmit = () => {
    if (selectedOrder) {
      updateStatus(selectedOrder.orderNo, 'cancelled', remark);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: '产品编号',
      dataIndex: 'productNo',
      key: 'productNo',
      width: 120,
    },
    {
      title: '代理类型',
      dataIndex: 'staticType',
      key: 'staticType',
      width: 100,
      render: (type: string) => (
        type === '1' ? '家庭代理' : '数据中心'
      ),
    },
    {
      title: '地区',
      dataIndex: 'regionCode',
      key: 'regionCode',
      width: 100,
    },
    {
      title: 'IP数量',
      dataIndex: 'ipCount',
      key: 'ipCount',
      width: 80,
    },
    {
      title: '时长(天)',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'gold', text: '待处理' },
          processing: { color: 'blue', text: '处理中' },
          success: { color: 'green', text: '成功' },
          failed: { color: 'red', text: '失败' },
          cancelled: { color: 'default', text: '已取消' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: StaticOrder) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="link"
                onClick={() => handleUpdateStatus(record, 'processing')}
              >
                处理
              </Button>
              <Button
                size="small"
                type="link"
                danger
                onClick={() => handleUpdateStatus(record, 'cancelled')}
              >
                取消
              </Button>
            </>
          )}
          {record.status === 'processing' && (
            <>
              <Button
                size="small"
                type="link"
                onClick={() => handleUpdateStatus(record, 'success')}
              >
                完成
              </Button>
              <Button
                size="small"
                type="link"
                danger
                onClick={() => handleUpdateStatus(record, 'failed')}
              >
                失败
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="静态代理订单列表" bordered={false}>
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 24 }}
      >
        <Form.Item name="status" label="状态">
          <Select style={{ width: 120 }} allowClear>
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="success">成功</Option>
            <Option value="failed">失败</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </Form.Item>
        
        <Form.Item name="dateRange" label="创建时间">
          <RangePicker showTime />
        </Form.Item>
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button onClick={() => {
              searchForm.resetFields();
              setSearchParams({ page: 1, pageSize: 10 });
            }}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data?.data.list}
        loading={loading}
        rowKey="orderNo"
        pagination={{
          total: data?.data.total,
          current: searchParams.page,
          pageSize: searchParams.pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="取消订单"
        visible={remarkModalVisible}
        onOk={handleRemarkSubmit}
        onCancel={() => {
          setRemarkModalVisible(false);
          setSelectedOrder(null);
          setRemark('');
        }}
      >
        <Form.Item label="取消原因" required>
          <Input.TextArea
            rows={4}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入取消原因"
          />
        </Form.Item>
      </Modal>
    </Card>
  );
};

export default StaticOrderList;