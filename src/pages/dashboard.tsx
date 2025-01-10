import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, message } from 'antd';
import { getStatistics, StatisticsData } from '../services/statistics';
import { formatBytes } from '../utils/format';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalRecharge: 0,
    totalConsumption: 0,
    balance: 0,
    monthlyRecharge: 0,
    monthlyConsumption: 0,
    lastMonthConsumption: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await getStatistics();
      setStatistics(data);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const basicStats = [
    { 
      title: '累计充值', 
      value: statistics.totalRecharge,
      prefix: '¥',
      color: '#52c41a',
      icon: 'recharge'
    },
    { 
      title: '累计消费', 
      value: statistics.totalConsumption,
      prefix: '¥',
      color: '#f5222d',
      icon: 'consumption'
    },
    { 
      title: '剩余金额', 
      value: statistics.balance,
      prefix: '¥',
      color: '#1890ff',
      icon: 'balance'
    },
    { 
      title: '本月充值', 
      value: statistics.monthlyRecharge,
      prefix: '¥',
      color: '#722ed1',
      icon: 'monthly-recharge'
    },
    { 
      title: '本月消费', 
      value: statistics.monthlyConsumption,
      prefix: '¥',
      color: '#13c2c2',
      icon: 'monthly-consumption'
    },
    { 
      title: '上月消费', 
      value: statistics.lastMonthConsumption,
      prefix: '¥',
      color: '#eb2f96',
      icon: 'last-month'
    }
  ];

  const dynamicResources = [
    {
      title: '动态资源1',
      percent: 50,
      total: '1024G',
      monthly: '256G',
      lastMonth: '320G',
      today: '28G'
    },
    {
      title: '动态资源2',
      percent: 75,
      total: '2048G',
      monthly: '512G',
      lastMonth: '486G',
      today: '64G'
    },
    {
      title: '动态资源3',
      percent: 25,
      total: '4096G',
      monthly: '1024G',
      lastMonth: '896G',
      today: '128G'
    }
  ];

  const staticResources = [
    {
      title: '静态资源1',
      percent: 60,
      total: '1000条',
      monthlyAvailable: '200条',
      remainingAvailable: '300条',
      lastMonth: '180条',
      expired: '120条'
    },
    {
      title: '静态资源2',
      percent: 80,
      total: '2000条',
      monthlyAvailable: '400条',
      remainingAvailable: '600条',
      lastMonth: '380条',
      expired: '220条'
    },
    {
      title: '静态资源3',
      percent: 40,
      total: '3000条',
      monthlyAvailable: '600条',
      remainingAvailable: '900条',
      lastMonth: '550条',
      expired: '350条'
    }
  ];

  return (
    <div className="p-6">
      {/* 基础统计数据 */}
      <Row gutter={[16, 16]}>
        {basicStats.map((stat, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card>
              <Statistic
                loading={loading}
                title={stat.title}
                value={stat.value}
                precision={2}
                prefix={stat.prefix}
                valueStyle={{ color: stat.color }}
                suffix="元"
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 动态资源使用情况 */}
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">动态资源使用情况</h2>
        <Row gutter={[16, 16]}>
          {dynamicResources.map((resource, index) => (
            <Col key={index} xs={24} sm={12} md={8}>
              <Card>
                <div className="mb-4">
                  <div className="font-medium mb-2">{resource.title}</div>
                  <Progress percent={resource.percent} />
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="text-sm">
                      <div className="mb-1">累计：{resource.total}</div>
                      <div className="mb-1">本月：{resource.monthly}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="text-sm">
                      <div className="mb-1">上月：{resource.lastMonth}</div>
                      <div>今日：{resource.today}</div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 静态资源使用情况 */}
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">静态资源使用情况</h2>
        <Row gutter={[16, 16]}>
          {staticResources.map((resource, index) => (
            <Col key={index} xs={24} sm={12} md={8}>
              <Card>
                <div className="mb-4">
                  <div className="font-medium mb-2">{resource.title}</div>
                  <Progress percent={resource.percent} />
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="text-sm">
                      <div className="mb-1">总开通：{resource.total}</div>
                      <div className="mb-1">本月可用：{resource.monthlyAvailable}</div>
                      <div>剩余可用：{resource.remainingAvailable}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="text-sm">
                      <div className="mb-1">上月：{resource.lastMonth}</div>
                      <div>已过期：{resource.expired}</div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;