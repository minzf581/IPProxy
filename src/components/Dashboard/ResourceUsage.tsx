import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { ResourceUsageData } from '@/types/dashboard';

const ResourceUsage: React.FC<ResourceUsageData> = ({
  title,
  percentage,
  total,
  current,
  lastMonth,
  today
}) => {
  return (
    <Card className="h-48">
      <div className="flex items-center gap-2 mb-4">
        <Typography.Text>{title}</Typography.Text>
        <Progress 
          percent={percentage} 
          showInfo={false} 
          size={4}
        />
        <Typography.Text>{percentage}%</Typography.Text>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Typography.Text className="text-gray-500">累计：</Typography.Text>
          <Typography.Text>{total}</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">本月：</Typography.Text>
          <Typography.Text>{current}</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">上月：</Typography.Text>
          <Typography.Text>{lastMonth}</Typography.Text>
        </div>
        <div>
          <Typography.Text className="text-gray-500">今日：</Typography.Text>
          <Typography.Text>{today}</Typography.Text>
        </div>
      </div>
    </Card>
  );
};

export default ResourceUsage;