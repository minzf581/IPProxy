import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Divider } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface ResourceStatistics {
  total_opened: number;
  last_month_opened: number;
  this_month_opened: number;
  available_count: number;
  expired_count: number;
}

interface ResourceData {
  id: number;
  name: string;
  statistics: ResourceStatistics;
}

interface ResourceStatisticsResponse {
  dynamic: ResourceData[];
  static: ResourceData[];
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resourceStats, setResourceStats] = useState<ResourceStatisticsResponse>({
    dynamic: [],
    static: []
  });

  useEffect(() => {
    const fetchResourceStatistics = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard/resource-statistics');
        const data = await response.json();
        if (data.code === 0) {
          setResourceStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch resource statistics:', error);
      }
      setLoading(false);
    };

    fetchResourceStatistics();
  }, []);

  const renderResourceSection = (title: string, resources: ResourceData[]) => (
    <Card 
      title={title} 
      className={styles.resourceCard}
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {resources.map(resource => (
          <Col span={24} key={resource.id}>
            <Card title={resource.name} bordered={false}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="累计开通"
                    value={resource.statistics.total_opened}
                    suffix="个"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="上月开通"
                    value={resource.statistics.last_month_opened}
                    suffix="个"
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="本月开通"
                    value={resource.statistics.this_month_opened}
                    suffix="个"
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="剩余可用"
                    value={resource.statistics.available_count}
                    suffix="个"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="已过期"
                    value={resource.statistics.expired_count}
                    suffix="个"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  return (
    <div className={styles.dashboard}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {renderResourceSection('动态资源使用情况', resourceStats.dynamic)}
        </Col>
        <Col span={24}>
          {renderResourceSection('静态资源使用情况', resourceStats.static)}
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 