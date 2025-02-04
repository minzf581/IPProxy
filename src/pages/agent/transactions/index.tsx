import React, { useEffect, useState } from 'react';
import { Card, Table, Input, DatePicker, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/lib/table';
import moment from 'moment';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface Transaction {
  id: number;
  order_no: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  operator_name: string;
}

const AgentTransactions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });
  const [searchParams, setSearchParams] = useState({
    order_no: '',
    start_date: '',
    end_date: '',
  });

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '订单名',
      key: 'order_name',
      render: () => '总后台添加',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => moment(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agent/transactions?page=${pagination.current}&page_size=${pagination.pageSize}&order_no=${searchParams.order_no}&start_date=${searchParams.start_date}&end_date=${searchParams.end_date}`, {
        credentials: 'include',
      });
      const result = await response.json();
      
      if (result.code === 0) {
        setData(result.data.items);
        setTotal(result.data.total);
      } else {
        message.error(result.message || '获取数据失败');
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
  };

  const handleDateChange = (dates: any) => {
    if (dates) {
      setSearchParams({
        ...searchParams,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setSearchParams({
        ...searchParams,
        start_date: '',
        end_date: '',
      });
    }
  };

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.searchBar}>
          <Input
            placeholder="请输入订单号"
            value={searchParams.order_no}
            onChange={(e) => setSearchParams({ ...searchParams, order_no: e.target.value })}
            style={{ width: 200, marginRight: 16 }}
          />
          <RangePicker
            onChange={handleDateChange}
            style={{ marginRight: 16 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default AgentTransactions; 