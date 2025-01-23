import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  message,
  Modal,
  Select,
} from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getUserList, updateUserStatus, updateUserPassword } from '@/services/userService';
import type { User, UserListParams } from '@/services/userService';
import './index.less';

const { Option } = Select;

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [passwordModal, setPasswordModal] = useState<{visible: boolean; userId: string}>({
    visible: false,
    userId: ''
  });

  // 添加 useEffect 钩子
  useEffect(() => {
    fetchData({
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, []);

  // 获取数据
  const fetchData = async (params: UserListParams) => {
    setLoading(true);
    try {
      const response = await getUserList({
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        username: params.username,
        agentAccount: params.agentAccount,
        status: params.status
      });
      
      if (response.code === 0) {
        setData(response.data.list);
        setPagination({
          ...pagination,
          total: response.data.total,
        });
      } else {
        message.error(response.msg || '获取数据失败');
      }
    } catch (error) {
      message.error('获取数据失败');
    }
    setLoading(false);
  };

  // 处理表格变化
  const handleTableChange: TableProps<User>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    fetchData({
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...form.getFieldsValue(),
    });
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData({
      ...form.getFieldsValue(),
      page: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchData({
      page: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 修改密码
  const handleUpdatePassword = async (values: { password: string }) => {
    try {
      const response = await updateUserPassword(passwordModal.userId, values.password);
      if (response.code === 0) {
        message.success('密码修改成功');
        setPasswordModal({ visible: false, userId: '' });
      } else {
        message.error(response.msg || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  // 查看仪表盘
  const handleViewDashboard = (userId: string) => {
    navigate(`/dashboard?user_id=${userId}`);
  };

  // 更新状态
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const response = await updateUserStatus(userId, newStatus);
      if (response.code === 0) {
        message.success('状态更新成功');
        fetchData({
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...form.getFieldsValue(),
        });
      } else {
        message.error(response.msg || '状态更新失败');
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 表格列配置
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '账号',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      align: 'center',
    },
    {
      title: '所属代理商',
      dataIndex: 'agentAccount',
      key: 'agentAccount',
      width: 120,
      align: 'center',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <span style={{ color: status === 'enabled' ? '#52c41a' : '#ff4d4f' }}>
          {status === 'enabled' ? '正常' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      align: 'center',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 280,
      align: 'center',
      render: (_, record) => (
        <Space size="middle" className="actionButtons">
          <Button 
            type="link" 
            size="small"
            className="actionButton"
            onClick={() => setPasswordModal({ visible: true, userId: record.id })}
          >
            修改密码
          </Button>
          <Button 
            type="link"
            size="small"
            className="actionButton"
            onClick={() => handleViewDashboard(record.id)}
          >
            查看仪表盘
          </Button>
          <Button 
            type="link"
            size="small"
            className={`actionButton ${record.status === 'enabled' ? 'dangerButton' : 'enableButton'}`}
            onClick={() => handleUpdateStatus(record.id, record.status === 'enabled' ? 'disabled' : 'enabled')}
          >
            {record.status === 'enabled' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 24 }}
      >
        <Form.Item name="username" label="用户账号">
          <Input placeholder="请输入用户账号" allowClear />
        </Form.Item>
        <Form.Item name="agentAccount" label="所属代理商">
          <Input placeholder="请输入代理商账号" allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="全部" allowClear style={{ width: 120 }}>
            <Option value="enabled">正常</Option>
            <Option value="disabled">禁用</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="修改密码"
        open={passwordModal.visible}
        onCancel={() => setPasswordModal({ visible: false, userId: '' })}
        footer={null}
      >
        <Form onFinish={handleUpdatePassword}>
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setPasswordModal({ visible: false, userId: '' })}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagementPage; 