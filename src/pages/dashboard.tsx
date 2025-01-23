import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Spin, Progress } from 'antd';
import { getDashboardData, DashboardData } from '@/services/dashboard';
import styles from './dashboard.module.less';

// 预设的默认资源数据
const defaultDashboardData: DashboardData = {
  balance: 0,
  total_recharge: 0,
  total_consumption: 0,
  month_recharge: 0,
  month_consumption: 0,
  last_month_consumption: 0,
  dynamic_resources: [
    {
      title: '动态资源1',
      total: '1024',
      used: '28',
      today: '256',
      lastMonth: '320',
      percentage: 50
    },
    {
      title: '动态资源2',
      total: '2048',
      used: '64',
      today: '512',
      lastMonth: '486',
      percentage: 75
    },
    {
      title: '动态资源3',
      total: '4096',
      used: '128',
      today: '1024',
      lastMonth: '896',
      percentage: 25
    }
  ],
  static_resources: [
    {
      title: '静态资源1',
      total: '1000',
      used: '120',
      today: '200',
      lastMonth: '180',
      available: '300',
      percentage: 60
    },
    {
      title: '静态资源2',
      total: '2000',
      used: '220',
      today: '400',
      lastMonth: '380',
      available: '600',
      percentage: 80
    },
    {
      title: '静态资源3',
      total: '3000',
      used: '350',
      today: '600',
      lastMonth: '550',
      available: '900',
      percentage: 40
    },
    {
      title: '静态资源4',
      total: '1500',
      used: '150',
      today: '300',
      lastMonth: '280',
      available: '450',
      percentage: 55
    },
    {
      title: '静态资源5',
      total: '2500',
      used: '250',
      today: '500',
      lastMonth: '480',
      available: '750',
      percentage: 70
    },
    {
      title: '静态资源7',
      total: '3500',
      used: '450',
      today: '700',
      lastMonth: '680',
      available: '1050',
      percentage: 45
    }
  ]
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      if (response.code === 0) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return <div className={styles.loading}><Spin size="large" /></div>;
  }

  const formatNumber = (num: string | number | null | undefined) => {
    if (num == null) return '0';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return value.toLocaleString();
  };

  return (
    <div className={styles.dashboard}>
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>累计充值</div>
            <div className={styles.value}>
              {formatNumber(dashboardData.total_recharge)}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>累计消费</div>
            <div className={styles.value}>
              {formatNumber(dashboardData.total_consumption)}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>剩余金额</div>
            <div className={styles.value}>
              {formatNumber(dashboardData.balance)}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>本月充值</div>
            <div className={styles.value}>
              {formatNumber(dashboardData.month_recharge)}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>本月消费</div>
            <div className={styles.value}>
              {formatNumber(dashboardData.month_consumption)}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>上月消费</div>
            <div className={styles.value}>
              {formatNumber(dashboardData.last_month_consumption)}
            </div>
          </Card>
        </Col>
      </Row>

      <div className={styles.sectionTitle}>动态资源使用情况</div>
      <Row gutter={[16, 16]}>
        {dashboardData.dynamic_resources.map((resource, index) => (
          <Col span={8} key={`dynamic-${index}`}>
            <Card className={styles.resourceCard}>
              <div className={styles.resourceTitle}>{resource.title}</div>
              <div className={styles.resourceContent}>
                <div className={styles.resourceInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>累计：</span>
                    <span className={styles.value}>{formatNumber(resource.total)}G</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>本月：</span>
                    <span className={styles.value}>{formatNumber(resource.today)}G</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>上月：</span>
                    <span className={styles.value}>{formatNumber(resource.lastMonth)}G</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>今日：</span>
                    <span className={styles.value}>{formatNumber(resource.used)}G</span>
                  </div>
                </div>
                <Progress 
                  percent={resource.percentage} 
                  status="active"
                  format={(percent) => `${percent}%`}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className={styles.sectionTitle}>静态资源使用情况</div>
      <Row gutter={[16, 16]}>
        {dashboardData.static_resources.map((resource, index) => (
          <Col span={8} key={`static-${index}`}>
            <Card className={styles.resourceCard}>
              <div className={styles.resourceTitle}>{resource.title}</div>
              <div className={styles.resourceContent}>
                <div className={styles.resourceInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>总开通：</span>
                    <span className={styles.value}>{formatNumber(resource.total)}条</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>本月可用：</span>
                    <span className={styles.value}>{formatNumber(resource.today)}条</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>上月：</span>
                    <span className={styles.value}>{formatNumber(resource.lastMonth)}条</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>剩余可用：</span>
                    <span className={styles.value}>{formatNumber(resource.available)}条</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>已过期：</span>
                    <span className={styles.value}>{formatNumber(resource.used)}条</span>
                  </div>
                </div>
                <Progress 
                  percent={resource.percentage} 
                  status="active"
                  format={(percent) => `${percent}%`}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;