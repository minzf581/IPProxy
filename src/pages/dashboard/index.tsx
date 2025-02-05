import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Button, Progress } from 'antd';
import { api } from '@/utils/request';
import styles from './index.module.less';
import { DashboardData as IDashboardData, DynamicResource, StaticResource } from '@/types/dashboard';
import type { Agent } from '@/types/agent';
import { AxiosError } from 'axios';

interface DashboardData {
  statistics: {
    balance: number;
    totalRecharge: number;
    totalConsumption: number;
    monthRecharge: number;
    monthConsumption: number;
    lastMonthConsumption: number;
  };
  dynamicResources: Array<{
    id: string;
    name: string;
    usageRate: number;
    total: number;
    monthly: number;
    today: number;
    lastMonth: number;
  }>;
  staticResources: Array<{
    id: string;
    name: string;
    usageRate: number;
    total: number;
    monthly: number;
    lastMonth: number;
    available: number;
    expired: number;
  }>;
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
  dynamicResources: [
    {
      id: '1',
      name: '动态住宅代理',
      usageRate: 0,
      total: 0,
      monthly: 0,
      today: 0,
      lastMonth: 0
    },
    {
      id: '2',
      name: '动态数据中心代理',
      usageRate: 0,
      total: 0,
      monthly: 0,
      today: 0,
      lastMonth: 0
    },
    {
      id: '3',
      name: '动态手机代理',
      usageRate: 0,
      total: 0,
      monthly: 0,
      today: 0,
      lastMonth: 0
    }
  ],
  staticResources: [
    {
      id: '1',
      name: '静态住宅代理',
      usageRate: 0,
      total: 0,
      monthly: 0,
      lastMonth: 0,
      available: 0,
      expired: 0
    },
    {
      id: '2',
      name: '静态数据中心代理',
      usageRate: 0,
      total: 0,
      monthly: 0,
      lastMonth: 0,
      available: 0,
      expired: 0
    },
    {
      id: '3',
      name: '静态手机代理',
      usageRate: 0,
      total: 0,
      monthly: 0,
      lastMonth: 0,
      available: 0,
      expired: 0
    },
    {
      id: '4',
      name: '静态住宅代理2',
      usageRate: 0,
      total: 0,
      monthly: 0,
      lastMonth: 0,
      available: 0,
      expired: 0
    },
    {
      id: '5',
      name: '静态数据中心代理2',
      usageRate: 0,
      total: 0,
      monthly: 0,
      lastMonth: 0,
      available: 0,
      expired: 0
    },
    {
      id: '7',
      name: '静态手机代理2',
      usageRate: 0,
      total: 0,
      monthly: 0,
      lastMonth: 0,
      available: 0,
      expired: 0
    }
  ]
};

const Dashboard: React.FC<Props> = ({ currentAgent }) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<IDashboardData>(defaultDashboardData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard mounted, currentAgent:', currentAgent);
    fetchDashboardData();
  }, [currentAgent]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data for agent:', currentAgent);
      
      const apiPath = currentAgent 
        ? `/api/open/app/agent/${currentAgent.id}/dashboard`
        : '/api/open/app/agent/dashboard';
      
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

  const renderStatisticsCards = () => {
    if (!dashboardData) return null;

    const { statistics } = dashboardData;
    
    return (
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={statistics.balance}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总充值"
              value={statistics.totalRecharge}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总消费"
              value={statistics.totalConsumption}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="本月消费"
              value={statistics.monthConsumption}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderDynamicResources = (resources: DynamicResource[]) => {
    return resources.map((resource) => (
      <Col span={8} key={resource.id}>
        <Card>
          <Statistic title={resource.name} value={resource.total} suffix="Gb" />
          <Progress percent={resource.usageRate} status="active" />
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="本月" value={resource.monthly} suffix="Gb" />
            </Col>
            <Col span={8}>
              <Statistic title="今日" value={resource.today} suffix="Gb" />
            </Col>
            <Col span={8}>
              <Statistic title="上月" value={resource.lastMonth} suffix="Gb" />
            </Col>
          </Row>
        </Card>
      </Col>
    ));
  };

  const renderStaticResources = (resources: StaticResource[]) => {
    return resources.map((resource) => (
      <Col span={8} key={resource.id}>
        <Card>
          <Statistic title={resource.name} value={resource.total} />
          <Progress percent={resource.usageRate} status="active" />
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="本月" value={resource.monthly} />
            </Col>
            <Col span={8}>
              <Statistic title="上月" value={resource.lastMonth} />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <Statistic title="可用" value={resource.available} />
            </Col>
            <Col span={12}>
              <Statistic title="过期" value={resource.expired} />
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
        <Button type="primary" onClick={fetchDashboardData}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <div className={styles.dashboard}>
        {renderStatisticsCards()}
        <div className={styles.resourceSection}>
          <h2>动态资源</h2>
          <Row gutter={[16, 16]}>
            {dashboardData?.dynamicResources ? renderDynamicResources(dashboardData.dynamicResources) : null}
          </Row>
        </div>
        <div className={styles.resourceSection}>
          <h2>静态资源</h2>
          <Row gutter={[16, 16]}>
            {dashboardData?.staticResources ? renderStaticResources(dashboardData.staticResources) : null}
          </Row>
        </div>
      </div>
    </Spin>
  );
};

export default Dashboard; 