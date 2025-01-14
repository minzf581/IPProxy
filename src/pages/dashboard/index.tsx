import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Progress, message } from 'antd';
import { getDashboardData, DashboardData } from '../../services/dashboard';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    total_consumption: 0,
    total_recharge: 0,
    balance: 0,
    month_recharge: 0,
    month_consumption: 0,
    last_month_consumption: 0,
    dynamic_resources: [],
    static_resources: []
  });

  const fetchDashboardData = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      const data = await getDashboardData(signal);
      setDashboardData(data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('获取仪表盘数据失败:', error);
        message.error('获取仪表盘数据失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchDashboardData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, trend }: { title: string; value: string; trend?: 'up' | 'down' }) => (
    <div className="bg-white p-6 rounded">
      <div className="text-gray-500 text-sm mb-4">{title}</div>
      <div className={`text-2xl ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}`}>
        {value}
      </div>
    </div>
  );

  const ResourceCard = ({ title, percentage, data }: { 
    title: string; 
    percentage: number;
    data: {
      total: string;
      used: string;
      today: string;
      lastMonth: string;
      available?: string;
    }
  }) => (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-600">{title}</span>
        <span className="text-gray-400">{percentage}%</span>
      </div>
      <Progress 
        percent={percentage} 
        showInfo={false}
        strokeColor="#1890ff"
        trailColor="#f0f0f0"
        className="mb-4"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-500 mb-2">累计：{data.total}</div>
          <div className="text-gray-500 mb-2">本月：{data.used}</div>
          <div className="text-gray-500">上月：{data.lastMonth}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-2">今日：{data.today}</div>
          {data.available && (
            <div className="text-gray-500">剩余可用：{data.available}</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100">
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-6">
            <Col span={8}>
              <StatCard 
                title="累计消费" 
                value={`¥ ${dashboardData.total_consumption.toFixed(2)} 元`} 
              />
            </Col>
            <Col span={8}>
              <StatCard 
                title="累计充值" 
                value={`¥ ${dashboardData.total_recharge.toFixed(2)} 元`} 
              />
            </Col>
            <Col span={8}>
              <StatCard 
                title="剩余金额" 
                value={`¥ ${dashboardData.balance.toFixed(2)} 元`} 
              />
            </Col>
            <Col span={8}>
              <StatCard 
                title="本月充值" 
                value={`¥ ${dashboardData.month_recharge.toFixed(2)} 元`} 
                trend="up" 
              />
            </Col>
            <Col span={8}>
              <StatCard 
                title="本月消费" 
                value={`¥ ${dashboardData.month_consumption.toFixed(2)} 元`} 
                trend="down" 
              />
            </Col>
            <Col span={8}>
              <StatCard 
                title="上月消费" 
                value={`¥ ${dashboardData.last_month_consumption.toFixed(2)} 元`} 
                trend="down" 
              />
            </Col>
          </Row>

          <div className="mb-6">
            <div className="text-base font-medium mb-4">动态资源使用情况</div>
            <Row gutter={[16, 16]}>
              {dashboardData.dynamic_resources.map((resource, index) => (
                <Col span={8} key={index}>
                  <ResourceCard
                    title={resource.title}
                    percentage={resource.percentage}
                    data={{
                      total: resource.total,
                      used: resource.used,
                      today: resource.today,
                      lastMonth: resource.lastMonth
                    }}
                  />
                </Col>
              ))}
            </Row>
          </div>

          <div>
            <div className="text-base font-medium mb-4">静态资源使用情况</div>
            <Row gutter={[16, 16]}>
              {dashboardData.static_resources.map((resource, index) => (
                <Col span={8} key={index}>
                  <ResourceCard
                    title={resource.title}
                    percentage={resource.percentage}
                    data={{
                      total: resource.total,
                      used: resource.used,
                      today: resource.today,
                      lastMonth: resource.lastMonth,
                      available: resource.available
                    }}
                  />
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
