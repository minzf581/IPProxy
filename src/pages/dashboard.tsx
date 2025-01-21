import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import styles from './dashboard.module.less';

interface StatisticsData {
  totalRecharge: number;
  totalConsumption: number;
  remainingBalance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
}

interface ResourceData {
  name: string;
  total: string;
  monthly: string;
  today: string;
  lastMonth: string;
  percentage: number;
}

interface StaticResourceData {
  name: string;
  total: string;
  monthlyAvailable: string;
  remainingAvailable: string;
  expired: string;
  percentage: number;
}

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalRecharge: 168880,
    totalConsumption: 17780,
    remainingBalance: 151100,
    monthlyRecharge: 28660,
    monthlyConsumption: 8520,
    lastMonthConsumption: 9260
  });

  const dynamicResources: ResourceData[] = [
    {
      name: '动态资源1',
      total: '1024G',
      monthly: '256G',
      today: '28G',
      lastMonth: '320G',
      percentage: 50
    },
    {
      name: '动态资源2',
      total: '2048G',
      monthly: '512G',
      today: '64G',
      lastMonth: '486G',
      percentage: 75
    },
    {
      name: '动态资源3',
      total: '4096G',
      monthly: '1024G',
      today: '128G',
      lastMonth: '896G',
      percentage: 25
    }
  ];

  const staticResources: StaticResourceData[] = [
    {
      name: '静态资源1',
      total: '1000条',
      monthlyAvailable: '200条',
      remainingAvailable: '300条',
      expired: '120条',
      percentage: 60
    },
    {
      name: '静态资源2',
      total: '2000条',
      monthlyAvailable: '400条',
      remainingAvailable: '600条',
      expired: '220条',
      percentage: 80
    },
    {
      name: '静态资源3',
      total: '3000条',
      monthlyAvailable: '600条',
      remainingAvailable: '900条',
      expired: '350条',
      percentage: 40
    }
  ];

  return (
    <div className={styles.dashboard}>
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>累计充值</div>
            <div className={styles.value}>
              <ShoppingCartOutlined className={styles.icon} />
              {statistics.totalRecharge.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>累计消费</div>
            <div className={styles.value}>
              <DollarOutlined className={styles.icon} />
              {statistics.totalConsumption.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>剩余金额</div>
            <div className={styles.value}>
              <DollarOutlined className={styles.icon} />
              {statistics.remainingBalance.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>本月充值</div>
            <div className={styles.value}>
              <LineChartOutlined className={styles.icon} />
              {statistics.monthlyRecharge.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>本月消费</div>
            <div className={styles.value}>
              <LineChartOutlined className={styles.icon} />
              {statistics.monthlyConsumption.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card className={styles.statisticCard}>
            <div className={styles.title}>上月消费</div>
            <div className={styles.value}>
              <LineChartOutlined className={styles.icon} />
              {statistics.lastMonthConsumption.toLocaleString()}
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