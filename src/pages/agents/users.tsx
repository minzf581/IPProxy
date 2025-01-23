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
import './users.less';

const { RangePicker } = DatePicker;
const { Search } = Input;

interface UserData {
  id: string;
  app_username: string;
  main_account: string;
  remark: string;
  status: 'active' | 'disabled';
  created_at: string;
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
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: '账号',
      dataIndex: 'app_username',
      key: 'app_username',
      width: 120,
      align: 'center',
    },
    {
      title: '所属代理商',
      dataIndex: 'main_account',
      key: 'main_account',
      width: 120,
      align: 'center',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      align: 'center',
      render: (remark: string) => remark || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <span className={status === 'active' ? 'statusActive' : 'statusDisabled'}>
          {status === 'active' ? '正常' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
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
      render: (_, record: UserData) => (
        <Space size="middle" className="actionButtons">
          <Button 
            type="link" 
            size="small"
            className="actionButton"
            onClick={() => handleUpdatePassword(record)}
          >
            修改密码
          </Button>
          <Button 
            type="link"
            size="small"
            className="actionButton"
            onClick={() => handleViewDashboard(record)}
          >
            查看仪表盘
          </Button>
          <Button 
            type="link"
            size="small"
            className={`actionButton ${record.status === 'active' ? 'dangerButton' : 'enableButton'}`}
            onClick={() => handleUpdateStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
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
      const queryParams = new URLSearchParams({
        page: params.current.toString(),
        pageSize: params.pageSize.toString(),
        ...params,
      }).toString();

      const response = await fetch(`/api/open/app/user/list?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      
      if (result.code === 0) {
        setData(result.data.list);
        setPagination({
          ...pagination,
          total: result.data.total,
        });
      } else {
        message.error(result.message || '获取数据失败');
      }
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

  // 修改密码
  const handleUpdatePassword = (record: UserData) => {
    // TODO: 实现修改密码功能
    message.info('修改密码功能待实现');
  };

  // 查看仪表盘
  const handleViewDashboard = (record: UserData) => {
    // TODO: 实现查看仪表盘功能
    message.info('查看仪表盘功能待实现');
  };

  // 更新状态
  const handleUpdateStatus = async (record: UserData) => {
    try {
      const newStatus = record.status === 'active' ? 'disabled' : 'active';
      const response = await fetch(`/api/open/app/user/${record.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          app_username: record.app_username
        }),
      });
      
      const result = await response.json();
      if (result.code === 0) {
        message.success('状态更新成功');
        fetchData({
          current: pagination.current,
          pageSize: pagination.pageSize,
          ...form.getFieldsValue(),
        });
      } else {
        message.error(result.message || '状态更新失败');
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  return (
    <div className="userManagement">
      <div className="searchArea">
        <Space size="middle">
          <Search
            placeholder="请输入用户账号"
            style={{ width: 200 }}
            onSearch={handleSearch}
          />
          <Select
            placeholder="全部"
            style={{ width: 120 }}
            allowClear
            onChange={() => handleSearch()}
          >
            <Select.Option value="active">正常</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Table
        className="userTable"
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSize: 10,
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 1100 }}
      />
    </div>
  );
};

export default UserManagementPage; 