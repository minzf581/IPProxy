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
import type { TableProps, TablePaginationConfig } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getUserList, updateUserStatus, updateUserPassword, createUser, adjustUserBalance } from '@/services/userService';
import type { User, UserListParams, UserListResponse } from '@/types/user';
import type { CreateUserParams } from '@/services/userService';
import type { ApiResponse } from '@/types/api';
import styles from './index.module.less';
import { SearchOutlined, EditOutlined, LockOutlined, AppstoreAddOutlined, ReloadOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRequest } from '@/hooks/useRequest';
import BusinessActivationModal from "@/pages/users/components/BusinessActivationModal";
import ChangePasswordModal from '@/components/ChangePasswordModal';
import type { RangePickerProps } from 'antd/es/date-picker';
import { UserRole } from '@/types/user';
import { getAgentList } from '@/services/agentService';
import type { AgentInfo } from '@/types/agent';
import moment from 'moment';
import BalanceAdjustModal from '@/components/BalanceAdjustModal';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title } = Typography;

interface FormValues {
  username?: string;
  status?: string;
  dateRange?: [moment.Moment, moment.Moment];
  agent_id?: string | null;
}

interface BalanceFormValues {
  amount: number;
  remark: string;
}

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
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
  const [agentOptions, setAgentOptions] = useState<{ label: string; value: number; }[]>([]);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);

  // 加载代理商列表
  const loadAgents = async () => {
    try {
      const response = await getAgentList({ page: 1, pageSize: 100 });
      if (response.code === 0 && response.data?.list) {
        const options = response.data.list.map((agent: AgentInfo) => ({
          label: agent.username || agent.app_username || '',
          value: Number(agent.id)
        }));
        setAgentOptions(options);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      message.error('加载代理商列表失败');
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // 加载用户列表
  const loadUsers = async (params: UserListParams = { page: 1, pageSize: 10 }) => {
    try {
      setLoading(true);
      const finalParams: Required<UserListParams> = {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        username: params.username || '',
        status: params.status || '',
        dateRange: params.dateRange || [moment(), moment()],
        agent_id: params.agent_id || 0
      };
      const response = await getUserList(finalParams);
      if (response.code === 0 && response.data) {
        setData(response.data.list);
        setPagination({
          current: finalParams.page,
          pageSize: finalParams.pageSize,
          total: response.data.total
        });
      } else {
        message.error('获取用户列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadUsers();
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
      title: '额度',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (balance: number) => (
        <span>{balance ? `${balance.toFixed(2)} 元` : '0.00 元'}</span>
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
          <Button
            type="link"
            onClick={() => {
              setSelectedUser(record);
              setBalanceModalVisible(true);
            }}
          >
            调整额度
          </Button>
        </Space>
      ),
    },
  ];

  // 处理搜索
  const handleSearch = async (values: FormValues) => {
    const searchParams: UserListParams = {
      page: 1,
      pageSize: (pagination.pageSize as number) || 10,
      username: values.username,
      status: values.status,
      dateRange: values.dateRange,
      agent_id: values.agent_id ? Number(values.agent_id) : null
    };
    await loadUsers(searchParams);
  };

  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    loadUsers({ 
      page: 1,
      pageSize: pagination.pageSize ? Number(pagination.pageSize) : 10
    });
  };

  // 处理密码更新
  const handleUpdatePassword = async (userId: string, password: string) => {
    try {
      const userIdNum = Number(userId);
      if (isNaN(userIdNum)) {
        throw new Error('无效的用户ID');
      }
      await updateUserPassword(userIdNum, password);
      message.success('密码修改成功');
      setPasswordModal({ visible: false, userId: '' });
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    }
  };

  // 查看仪表盘
  const handleViewDashboard = (userId: string) => {
    navigate(`/dashboard?user_id=${userId}`);
  };

  // 处理状态更新
  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'disabled') => {
    try {
      const userIdNum = Number(userId);
      if (isNaN(userIdNum)) {
        throw new Error('无效的用户ID');
      }
      await updateUserStatus(userIdNum, newStatus);
      message.success('状态更新成功');
      await loadUsers({
        page: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
        ...searchForm.getFieldsValue()
      });
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
      console.log('[Create User Debug] Creating user with values:', {
        ...values,
        password: '******' // 隐藏密码
      });

      // 创建用户数据
      const createUserData: CreateUserParams = {
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        remark: values.remark || undefined,
        balance: values.balance === undefined ? 0 : Number(values.balance),
        is_agent: false, // 新建用户默认不是代理商
        status: 'active', // 默认状态为激活
        agent_id: values.agent_id ? Number(values.agent_id) : undefined
      };

      console.log('[Create User Debug] Prepared data:', {
        ...createUserData,
        password: '******' // 隐藏密码
      });

      const response = await createUser(createUserData);
      console.log('[Create User Debug] API response:', response);
      
      if (response.code === 0 && response.data) {
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

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const formValues: FormValues = searchForm.getFieldsValue();
    const params: UserListParams = {
      page: (newPagination.current as number) || 1,
      pageSize: (newPagination.pageSize as number) || 10,
      username: formValues.username,
      status: formValues.status,
      dateRange: formValues.dateRange,
      agent_id: formValues.agent_id ? Number(formValues.agent_id) : null
    };
    loadUsers(params);
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
          <Form.Item
            name="agent_id"
            label="代理商"
            getValueFromEvent={(value: string) => (value ? Number(value) : undefined)}
          >
            <Select
              placeholder="请选择代理商"
              allowClear
              options={agentOptions}
            />
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
          onChange={handleTableChange}
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
            <Input placeholder="请输入用户名" id="create-form-username" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" id="create-form-password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" id="create-form-email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="balance"
            label="初始余额"
            rules={[
              { type: 'number', min: 0, message: '余额不能小于0' }
            ]}
          >
            <InputNumber
              placeholder="请输入初始余额（可选）"
              min={0}
              precision={2}
              style={{ width: '100%' }}
              suffix="元"
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={4} placeholder="请输入备注信息" id="create-form-remark" />
          </Form.Item>
        </Form>
      </Modal>

      {businessModalVisible && selectedUser && (
        <BusinessActivationModal
          visible={businessModalVisible}
          user={selectedUser ? {
            id: selectedUser.id,
            username: selectedUser.username
          } : {
            id: 0,
            username: ''
          }}
          onCancel={() => {
            setBusinessModalVisible(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setBusinessModalVisible(false);
            setSelectedUser(null);
            loadUsers({
              page: pagination.current ? Number(pagination.current) : 1,
              pageSize: pagination.pageSize ? Number(pagination.pageSize) : 10
            });
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

      {selectedUser && (
        <BalanceAdjustModal
          visible={balanceModalVisible}
          onCancel={() => {
            setBalanceModalVisible(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setBalanceModalVisible(false);
            setSelectedUser(null);
            loadUsers({
              page: pagination.current ? Number(pagination.current) : 1,
              pageSize: pagination.pageSize ? Number(pagination.pageSize) : 10,
              ...searchForm.getFieldsValue()
            });
          }}
          target={selectedUser}
          targetType="user"
        />
      )}
    </div>
  );
};

export default UserManagementPage; 