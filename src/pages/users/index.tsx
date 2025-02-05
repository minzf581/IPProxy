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
  DatePicker,
  Typography,
  Tooltip,
  Tag,
  InputNumber,
  Radio,
} from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getUserList, updateUserStatus, updateUserPassword, createUser } from '@/services/userService';
import type { User, UserListParams, UserListResponse } from '@/types/user';
import type { CreateUserParams } from '@/services/userService';
import type { ApiResponse } from '@/types/api';
import styles from './index.module.less';
import { SearchOutlined, EditOutlined, LockOutlined, AppstoreAddOutlined, ReloadOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRequest } from '@/hooks/useRequest';
import BusinessActivationModal from './components/BusinessActivationModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title } = Typography;

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordModal, setPasswordModal] = useState<{visible: boolean; userId: string}>({
    visible: false,
    userId: ''
  });

  // 加载用户列表
  const loadUsers = async (params: UserListParams = {}) => {
    try {
      console.log('[User List Debug] Loading users with params:', params);
      setLoading(true);
      const response = await getUserList({
        page: params.page || pagination.current,
        pageSize: params.pageSize || pagination.pageSize,
        username: params.username,
        status: params.status,
        dateRange: params.dateRange
      });
      
      console.log('[User List Debug] API response:', response);
      
      if (response.code === 0 && response.data) {
        const { list = [], total = 0 } = response.data;
        console.log('[User List Debug] Parsed data:', { list, total });
        
        setData(list);
        setPagination(prev => ({
          ...prev,
          current: params.page || prev.current,
          total: total
        }));
        
        console.log('[User List Debug] Updated state:', {
          dataLength: list.length,
          pagination: {
            current: params.page || pagination.current,
            total: total
          }
        });
      } else {
        console.error('[User List Debug] Invalid response:', response);
        message.error(response.msg || '获取用户列表失败');
      }
    } catch (error: any) {
      console.error('[User List Debug] Error:', error);
      message.error(error.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    console.log('[User List Debug] Component mounted');
    loadUsers();
  }, []);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      console.log('[User List Debug] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[User List Debug] Data updated:', data);
  }, [data]);

  useEffect(() => {
    console.log('[User List Debug] Pagination updated:', pagination);
  }, [pagination]);

  // 表格列配置
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (text: string) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setPasswordModal({ visible: true, userId: String(record.id) });
            }}
          >
            修改密码
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setBusinessModalVisible(true);
            }}
          >
            业务开通
          </Button>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = async (values: any) => {
    const { username, status, dateRange } = values;
    const params: UserListParams = {
      page: 1,
      username,
      status,
      dateRange
    };
    await loadUsers(params);
  };

  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    loadUsers({ page: 1 });
  };

  // 处理更新密码
  const handleUpdatePassword = async (userId: number, password: string) => {
    try {
      const response = await updateUserPassword(String(userId), password);
      if (response.code === 0) {
        message.success('密码修改成功');
        setPasswordModal({ visible: false, userId: '' });
      } else {
        message.error(response.msg || '密码修改失败');
      }
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    }
  };

  // 查看仪表盘
  const handleViewDashboard = (userId: string) => {
    navigate(`/dashboard?user_id=${userId}`);
  };

  // 更新状态
  const handleUpdateStatus = async (userId: number, newStatus: string) => {
    try {
      const response = await updateUserStatus(String(userId), newStatus);
      if (response.code === 0) {
        message.success('状态更新成功');
        loadUsers({
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...searchForm.getFieldsValue(),
        });
      } else {
        message.error(response.msg || '状态更新失败');
      }
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      const response = await fetch(`/api/users/${selectedUser?.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include',
      });

      const result = await response.json();
      if (result.code === 0) {
        message.success('密码修改成功');
        setPasswordModal({ visible: false, userId: '' });
      } else {
        message.error(result.message || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  // 处理创建用户
  const handleCreateUser = async (values: CreateUserParams) => {
    try {
      console.log('[Create User Debug] Creating user with values:', values);
      const response = await createUser(values);
      console.log('[Create User Debug] API response:', response);
      
      if (response.code === 0) {
        message.success('创建用户成功');
        setCreateModalVisible(false);
        createForm.resetFields();
        console.log('[Create User Debug] Reloading user list...');
        // 重新加载用户列表，确保显示最新数据
        await loadUsers({
          page: 1,
          pageSize: pagination.pageSize,
          ...searchForm.getFieldsValue()
        });
      } else {
        console.error('[Create User Debug] API error:', response.msg);
        message.error(response.msg || '创建用户失败');
      }
    } catch (error: any) {
      console.error('[Create User Debug] Error:', error);
      message.error(error.message || '创建用户失败');
    }
  };

  return (
    <div className={styles.userManagement}>
      <Card title="用户管理">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 24 }}
        >
          <Form.Item name="username" label="用户账号">
            <Input placeholder="请输入用户账号" allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="创建时间">
            <RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
                创建用户
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
          onChange={(pagination, filters, sorter) => {
            loadUsers({
              page: pagination.current,
              pageSize: pagination.pageSize,
              ...searchForm.getFieldsValue()
            });
          }}
        />
      </Card>

      <Modal
        title="创建用户"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCreateModalVisible(false);
            createForm.resetFields();
          }}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => createForm.submit()}>
            确定
          </Button>
        ]}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
          preserve={false}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { pattern: /^[a-zA-Z0-9]+$/, message: '用户名只能包含大小写字母和数字' }
            ]}
          >
            <Input placeholder="请输入用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" autoComplete="email" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {businessModalVisible && selectedUser && (
        <BusinessActivationModal
          visible={businessModalVisible}
          user={selectedUser}
          onCancel={() => {
            setBusinessModalVisible(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setBusinessModalVisible(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {passwordModal.visible && selectedUser && (
        <ChangePasswordModal
          visible={passwordModal.visible}
          userId={passwordModal.userId}
          onCancel={() => {
            setPasswordModal({ visible: false, userId: '' });
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setPasswordModal({ visible: false, userId: '' });
            setSelectedUser(null);
            message.success('密码修改成功');
          }}
        />
      )}
    </div>
  );
};

export default UserManagementPage; 