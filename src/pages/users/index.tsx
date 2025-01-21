import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  message,
  Modal,
  Badge,
  Switch
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface UserData {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  balance: number;
  lastLoginTime: string;
  createTime: string;
}

const UserManagementPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 表格列配置
  const columns: ColumnsType<UserData> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge 
          status={status === 'active' ? 'success' : 'default'} 
          text={status === 'active' ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 180,
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
      width: 200,
      render: (_, record: UserData) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<UserData>['onChange'] = (
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
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      // 模拟数据
      const mockData: UserData[] = Array(10).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        username: `user${index + 1}`,
        email: `user${index + 1}@example.com`,
        status: Math.random() > 0.3 ? 'active' : 'inactive',
        role: ['普通用户', 'VIP用户'][Math.floor(Math.random() * 2)],
        balance: Math.floor(Math.random() * 10000) / 100,
        lastLoginTime: dayjs().subtract(Math.floor(Math.random() * 24), 'hour').format('YYYY-MM-DD HH:mm:ss'),
        createTime: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
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

  // 编辑用户
  const handleEdit = (record: UserData) => {
    Modal.info({
      title: '编辑用户',
      width: 600,
      content: (
        <Form layout="vertical" initialValues={record}>
          <Form.Item label="用户名" name="username">
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Switch checked={record.status === 'active'} />
          </Form.Item>
          <Form.Item label="角色" name="role">
            <Select
              options={[
                { label: '普通用户', value: '普通用户' },
                { label: 'VIP用户', value: 'VIP用户' },
              ]}
            />
          </Form.Item>
        </Form>
      ),
      okText: '保存',
      onOk: () => {
        message.success('保存成功');
        fetchData({
          current: pagination.current,
          pageSize: pagination.pageSize,
          ...form.getFieldsValue(),
        });
      },
    });
  };

  // 查看详情
  const handleViewDetails = (record: UserData) => {
    Modal.info({
      title: '用户详情',
      width: 600,
      content: (
        <div className={styles.userDetail}>
          <p><strong>用户名：</strong>{record.username}</p>
          <p><strong>邮箱：</strong>{record.email}</p>
          <p><strong>状态：</strong>
            <Badge 
              status={record.status === 'active' ? 'success' : 'default'} 
              text={record.status === 'active' ? '启用' : '禁用'}
            />
          </p>
          <p><strong>角色：</strong>{record.role}</p>
          <p><strong>余额：</strong>¥{record.balance.toFixed(2)}</p>
          <p><strong>最后登录：</strong>{record.lastLoginTime}</p>
          <p><strong>创建时间：</strong>{record.createTime}</p>
        </div>
      ),
    });
  };

  // 删除用户
  const handleDelete = (record: UserData) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${record.username} 吗？`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 替换为实际的API调用
          await fetch(`/api/users/${record.id}`, {
            method: 'DELETE',
          });
          message.success('删除成功');
          fetchData({
            current: pagination.current,
            pageSize: pagination.pageSize,
            ...form.getFieldsValue(),
          });
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 初始化加载数据
  React.useEffect(() => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, []);

  return (
    <div className={styles.userManagement}>
      <Card bordered={false}>
        <Form
          form={form}
          layout="inline"
          className={styles.searchForm}
          onFinish={handleSearch}
        >
          <Form.Item name="username">
            <Input
              placeholder="请输入用户名"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="email">
            <Input
              placeholder="请输入邮箱"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="用户状态"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '启用', value: 'active' },
                { label: '禁用', value: 'inactive' },
              ]}
            />
          </Form.Item>
          <Form.Item name="role">
            <Select
              placeholder="用户角色"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '普通用户', value: '普通用户' },
                { label: 'VIP用户', value: 'VIP用户' },
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
          rowKey="id"
          pagination={{
            ...pagination,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
          className={styles.table}
        />
      </Card>
    </div>
  );
};

export default UserManagementPage; 