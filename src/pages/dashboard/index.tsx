import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Button, Progress, Select } from 'antd';
import { api } from '@/utils/request';
import { API_ROUTES } from '@/shared/routes';
import styles from './index.module.less';
import { DashboardData as IDashboardData, DynamicResource, StaticResource } from '@/types/dashboard';
import type { Agent } from '@/types/agent';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';
import type { SelectProps } from 'antd';

const { Option } = Select;

interface User {
  id: string;
  username: string;
  is_agent: boolean;
  is_admin: boolean;
  balance: number;
  total_recharge: number;
  total_consumption: number;
}

interface Props {
  currentAgent: Agent | null;
  setCurrentAgent: (agent: Agent | null) => void;
}

const defaultDashboardData: IDashboardData = {
  statistics: {
    balance: 0,
    totalRecharge: 0,
    totalConsumption: 0,
    monthRecharge: 0,
    monthConsumption: 0,
    lastMonthConsumption: 0
  },
  dynamicResources: [],
  staticResources: [],
  dailyStats: []
};

const Dashboard: React.FC<Props> = ({ currentAgent }) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<IDashboardData>(defaultDashboardData);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const { user } = useAuth();

  useEffect(() => {
    console.log('Dashboard mounted, currentAgent:', currentAgent);
    fetchDashboardData();
  }, [currentAgent, selectedUserId]);

  useEffect(() => {
    if (user?.is_admin || user?.is_agent) {
      fetchUsers();
    }
  }, [user]);

  const fetchDashboardData = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data for user:', userId);
      
      const apiPath = userId 
        ? `/api/open/app/dashboard/info/v2?target_user_id=${userId}` 
        : '/api/open/app/dashboard/info/v2';
      
      console.log('Making request to:', apiPath);
      
      const response = await api.get(apiPath);
      console.log('Dashboard API response:', response);
      
      if (response.data.code === 0) {
        console.log('Dashboard data received:', response.data.data);
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data.message || '获取仪表盘数据失败');
      }
    } catch (err) {
      const error = err as AxiosError<{message?: string}>;
      const errorMessage = error.response?.data?.message || error.message || '获取仪表盘数据时发生错误';
      
      console.error('Error fetching dashboard data:', {
        error: error,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(API_ROUTES.USER.LIST, {
        params: {
          pageSize: 100,  // 设置较大的页面大小
          current: 1,
          // 根据用户角色过滤
          ...(user?.is_agent ? { agent_id: user.id } : {})
        }
      });
      
      if (response.data.code === 0 && Array.isArray(response.data.data?.list)) {
        setUsers(response.data.data.list);
      } else {
        setUsers([]);
        console.error('获取用户列表失败: 返回数据格式不正确', response.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
      setUsers([]);
    }
  };

  const handleUserChange: SelectProps['onChange'] = (value) => {
    console.log('Selected user changed:', value);
    setSelectedUserId(value as string);
    fetchDashboardData(value as string);
  };

  const renderStatisticsCards = () => {
    if (!dashboardData) return null;

    const { statistics } = dashboardData;
    
    return (
      <div className={styles.statisticsSection}>
        {/* 第一排：累计数据 */}
        <Row gutter={[12, 24]} className={styles.statisticsRow}>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: '12px' }}>
              <Statistic
                title="累计充值"
                value={statistics.totalRecharge}
                precision={2}
                suffix="元"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: '12px' }}>
              <Statistic
                title="累计消费"
                value={statistics.totalConsumption}
                precision={2}
                suffix="元"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: '12px' }}>
              <Statistic
                title="剩余金额"
                value={statistics.balance}
                precision={2}
                suffix="元"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
        
        {/* 第二排：月度数据 */}
        <Row gutter={[12, 24]} className={styles.statisticsRow}>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: '12px' }}>
              <Statistic
                title="本月消费"
                value={statistics.monthConsumption}
                precision={2}
                suffix="元"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: '12px' }}>
              <Statistic
                title="上月消费"
                value={statistics.lastMonthConsumption}
                precision={2}
                suffix="元"
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: '12px' }}>
              <Statistic
                title="本月充值"
                value={statistics.monthRecharge}
                precision={2}
                suffix="元"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderDynamicResources = () => {
    return dashboardData.dynamicResources.map((resource) => (
      <Col xs={24} sm={8} key={resource.title}>
        <Card 
          title={resource.title}
          className={styles.resourceCard}
          bodyStyle={{ padding: '12px' }}
        >
          <Progress
            percent={resource.percentage}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Statistic
                title="总流量"
                value={resource.total}
                suffix="GB"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="已用"
                value={resource.used}
                suffix="GB"
                valueStyle={{ fontSize: '14px', color: '#cf1322' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="剩余"
                value={resource.remaining}
                suffix="GB"
                valueStyle={{ fontSize: '14px', color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="今日"
                value={resource.today_usage}
                suffix="GB"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="本月"
                value={resource.month_usage}
                suffix="GB"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="上月"
                value={resource.last_month_usage}
                suffix="GB"
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    ));
  };

  const renderStaticResources = () => {
    return dashboardData.staticResources.map((resource) => (
      <Col xs={24} sm={8} key={resource.title}>
        <Card 
          title={resource.title}
          className={styles.resourceCard}
          bodyStyle={{ padding: '12px' }}
        >
          <Progress
            percent={resource.percentage}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Statistic
                title="总数量"
                value={resource.total}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="已用"
                value={resource.used}
                valueStyle={{ fontSize: '14px', color: '#cf1322' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="可用"
                value={resource.available}
                valueStyle={{ fontSize: '14px', color: '#3f8600' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="本月开通"
                value={resource.month_opened}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="上月开通"
                value={resource.last_month_opened}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    ));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <Button 
          type="primary" 
          onClick={() => fetchDashboardData()}
        >
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {(user?.is_admin || user?.is_agent) && users.length > 0 && (
        <div className={styles.userSelector}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>当前查看用户：</span>
            <Select
              placeholder="选择用户"
              onChange={handleUserChange}
              style={{ width: 200 }}
              allowClear
              value={selectedUserId}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>{user.username}</Option>
              ))}
            </Select>
            {selectedUserId && (
              <span style={{ marginLeft: 8, color: '#1890ff' }}>
                {users.find(u => u.id === selectedUserId)?.username || '未知用户'}
              </span>
            )}
          </div>
        </div>
      )}

      {renderStatisticsCards()}
      
      <div className={styles.resourceSection}>
        <h2>动态资源</h2>
        <Row gutter={[16, 16]}>
          {renderDynamicResources()}
        </Row>
      </div>
      
      <div className={styles.resourceSection}>
        <h2>静态资源</h2>
        <Row gutter={[16, 16]}>
          {renderStaticResources()}
        </Row>
      </div>
    </div>
  );
};

export default Dashboard; 