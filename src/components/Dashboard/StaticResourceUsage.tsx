import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { StaticResourceData } from '@/types/dashboard';

const StaticResourceUsage: React.FC<StaticResourceData> = ({
  title,
  percentage,
  total,
  currentMonth,
  lastMonth,
  available,
  expired
}) => {
  return (
    <Card className="h-48">
      <div className="flex items-center gap-2 mb-4">
        <Typography.Text>{title}</Typography.Text>
        <Progress percent={percentage} showInfo={false} size={4} />
        <Typography.Text>{percentage}%</Typography.Text>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Typography.Text className="text-gray-500">总开通：</Typography.Text>
          <Typography.Text>{total}条</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">本月可用：</Typography.Text>
          <Typography.Text>{currentMonth}条</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">上月：</Typography.Text>
          <Typography.Text>{lastMonth}条</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">剩余可用：</Typography.Text>
          <Typography.Text>{available}条</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">已过期：</Typography.Text>
          <Typography.Text>{expired}条</Typography.Text>
        </div>
      </div>
    </Card>
  );
};

export default StaticResourceUsage; 