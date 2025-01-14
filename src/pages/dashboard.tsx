import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress } from 'antd';
import { DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import styles from './dashboard.module.less';

interface Statistics {
  // 财务数据
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
  
  // 动态资源数据
  dynamic1: {
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  };
  dynamic2: {
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  };
  dynamic3: {
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  };
  
  // 静态资源数据
  static1: {
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  };
  static2: {
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  };
  static3: {
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  };
}

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  useEffect(() => {
    // Mock data for now
    setStatistics({
      totalRecharge: 168880,
      totalConsumption: 17780,
      balance: 151100,
      monthlyRecharge: 28660,
      monthlyConsumption: 8520,
      lastMonthConsumption: 9260,
      
      dynamic1: {
        total: 1024,
        monthly: 256,
        daily: 28,
        lastMonth: 320,
        percent: 50
      },
      dynamic2: {
        total: 2048,
        monthly: 512,
        daily: 64,
        lastMonth: 486,
        percent: 75
      },
      dynamic3: {
        total: 4096,
        monthly: 1024,
        daily: 128,
        lastMonth: 896,
        percent: 25
      },
      
      static1: {
        total: 1000,
        monthlyAvailable: 200,
        remainingAvailable: 300,
        lastMonth: 180,
        used: 120,
        percent: 60
      },
      static2: {
        total: 2000,
        monthlyAvailable: 400,
        remainingAvailable: 600,
        lastMonth: 380,
        used: 220,
        percent: 80
      },
      static3: {
        total: 3000,
        monthlyAvailable: 600,
        remainingAvailable: 900,
        lastMonth: 550,
        used: 350,
        percent: 40
      }
    });
  }, []);

  if (!statistics) {
    return <div>Loading...</div>;
  }

  const StatCard = ({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) => (
    <Card className={styles.statCard}>
      <div className={styles.statContent}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.statInfo}>
          <div className={styles.title}>{title}</div>
          <div className={styles.value}>{value}</div>
        </div>
      </div>
    </Card>
  );

  const ResourceCard = ({ 
    title, 
    total, 
    monthly, 
    daily, 
    lastMonth,
    percent 
  }: { 
    title: string;
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  }) => (
    <Card className={styles.resourceCard}>
      <div className={styles.resourceTitle}>{title}</div>
      <Progress percent={percent} showInfo={false} strokeWidth={8} />
      <div className={styles.resourceStats}>
        <div>
          <div>累计：{total}G</div>
          <div>上月：{lastMonth}G</div>
        </div>
        <div>
          <div>本月：{monthly}G</div>
          <div>今日：{daily}G</div>
        </div>
      </div>
    </Card>
  );

  const StaticResourceCard = ({ 
    title, 
    total,
    monthlyAvailable,
    remainingAvailable,
    lastMonth,
    used,
    percent 
  }: { 
    title: string;
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  }) => (
    <Card className={styles.resourceCard}>
      <div className={styles.resourceTitle}>{title}</div>
      <Progress percent={percent} showInfo={false} strokeWidth={8} />
      <div className={styles.resourceStats}>
        <div>
          <div>总开通：{total}条</div>
          <div>本月可用：{monthlyAvailable}条</div>
          <div>上月：{lastMonth}条</div>
        </div>
        <div>
          <div>剩余可用：{remainingAvailable}条</div>
          <div>已过期：{used}条</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className={styles.dashboard}>
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <StatCard 
            title="累计充值" 
            value={statistics.totalRecharge} 
            icon={<DollarOutlined />} 
          />
        </Col>
        <Col span={4}>
          <StatCard 
            title="累计消费" 
            value={statistics.totalConsumption} 
            icon={<DollarOutlined />} 
          />
        </Col>
        <Col span={4}>
          <StatCard 
            title="剩余金额" 
            value={statistics.balance} 
            icon={<DollarOutlined />} 
          />
        </Col>
        <Col span={4}>
          <StatCard 
            title="本月充值" 
            value={statistics.monthlyRecharge} 
            icon={<LineChartOutlined />} 
          />
        </Col>
        <Col span={4}>
          <StatCard 
            title="本月消费" 
            value={statistics.monthlyConsumption} 
            icon={<LineChartOutlined />} 
          />
        </Col>
        <Col span={4}>
          <StatCard 
            title="上月消费" 
            value={statistics.lastMonthConsumption} 
            icon={<LineChartOutlined />} 
          />
        </Col>
      </Row>

      <div className={styles.sectionTitle}>动态资源使用情况</div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <ResourceCard 
            title="动态资源1" 
            {...statistics.dynamic1}
          />
        </Col>
        <Col span={8}>
          <ResourceCard 
            title="动态资源2" 
            {...statistics.dynamic2}
          />
        </Col>
        <Col span={8}>
          <ResourceCard 
            title="动态资源3" 
            {...statistics.dynamic3}
          />
        </Col>
      </Row>

      <div className={styles.sectionTitle}>静态资源使用情况</div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <StaticResourceCard 
            title="静态资源1" 
            {...statistics.static1}
          />
        </Col>
        <Col span={8}>
          <StaticResourceCard 
            title="静态资源2" 
            {...statistics.static2}
          />
        </Col>
        <Col span={8}>
          <StaticResourceCard 
            title="静态资源3" 
            {...statistics.static3}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;