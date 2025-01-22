import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Progress, Spin } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import { getDashboardData } from '@/services/dashboard';
import styles from './dashboard.module.less';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalRecharge: 0,
    totalConsumption: 0,
    remainingBalance: 0,
    monthlyRecharge: 0,
    monthlyConsumption: 0,
    lastMonthConsumption: 0
  });

  const [dynamicResources, setDynamicResources] = useState<Array<{
    name: string;
    total: string;
    monthly: string;
    today: string;
    lastMonth: string;
    percentage: number;
  }>>([]);

  const [staticResources, setStaticResources] = useState<Array<{
    name: string;
    total: string;
    monthlyAvailable: string;
    remainingAvailable: string;
    expired: string;
    percentage: number;
  }>>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      
      // 更新统计数据
      setStatistics({
        totalRecharge: data.total_recharge,
        totalConsumption: data.total_consumption,
        remainingBalance: data.balance,
        monthlyRecharge: data.month_recharge,
        monthlyConsumption: data.month_consumption,
        lastMonthConsumption: data.last_month_consumption
      });

      // 更新动态资源数据
      setDynamicResources(data.dynamic_resources.map(resource => ({
        name: resource.title,
        total: resource.total,
        monthly: resource.used,
        today: resource.today,
        lastMonth: resource.lastMonth,
        percentage: resource.percentage
      })));

      // 更新静态资源数据
      setStaticResources(data.static_resources.map(resource => ({
        name: resource.title,
        total: resource.total,
        monthlyAvailable: resource.used,
        remainingAvailable: resource.available,
        expired: resource.lastMonth,
        percentage: resource.percentage
      })));
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 设置自动刷新间隔（每5分钟）
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return <div className={styles.loading}><Spin size="large" /></div>;
  }

  return (
    <div className={styles.dashboard}>
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>累计充值</div>
            <div className={styles.value}>
              <ShoppingCartOutlined className={styles.icon} />
              ¥ {statistics.totalRecharge.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>累计消费</div>
            <div className={styles.value}>
              <DollarOutlined className={styles.icon} />
              ¥ {statistics.totalConsumption.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>剩余金额</div>
            <div className={styles.value}>
              <DollarOutlined className={styles.icon} />
              ¥ {statistics.remainingBalance.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>本月充值</div>
            <div className={styles.value}>
              <LineChartOutlined className={styles.icon} />
              ¥ {statistics.monthlyRecharge.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>本月消费</div>
            <div className={styles.value}>
              <LineChartOutlined className={styles.icon} />
              ¥ {statistics.monthlyConsumption.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>上月消费</div>
            <div className={styles.value}>
              <LineChartOutlined className={styles.icon} />
              ¥ {statistics.lastMonthConsumption.toLocaleString()}
            </div>
          </Card>
        </Col>
      </Row>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>动态资源使用情况</div>
        <Row gutter={[16, 16]}>
          {dynamicResources.map((resource, index) => (
            <Col span={8} key={index}>
              <Card className={styles.resourceCard}>
                <div className={styles.resourceTitle}>{resource.name}</div>
                <Progress percent={resource.percentage} />
                <div className={styles.resourceInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>累计：</span>
                    <span className={styles.value}>{resource.total}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>本月：</span>
                    <span className={styles.value}>{resource.monthly}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>上月：</span>
                    <span className={styles.value}>{resource.lastMonth}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>今日：</span>
                    <span className={styles.value}>{resource.today}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>静态资源使用情况</div>
        <Row gutter={[16, 16]}>
          {staticResources.map((resource, index) => (
            <Col span={8} key={index}>
              <Card className={styles.resourceCard}>
                <div className={styles.resourceTitle}>{resource.name}</div>
                <Progress percent={resource.percentage} />
                <div className={styles.resourceInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>总开通：</span>
                    <span className={styles.value}>{resource.total}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>本月可用：</span>
                    <span className={styles.value}>{resource.monthlyAvailable}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>剩余可用：</span>
                    <span className={styles.value}>{resource.remainingAvailable}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>已过期：</span>
                    <span className={styles.value}>{resource.expired}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;