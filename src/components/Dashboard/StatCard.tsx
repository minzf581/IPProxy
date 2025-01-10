import React from 'react';
import { Card, Typography, Spin } from 'antd';

interface StatCardProps {
  title: string;
  value?: number;
  amount?: number;
  icon?: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  amount, 
  icon,
  loading = false 
}) => {
  const displayValue = value ?? amount;
  
  return (
    <Card className="h-24 flex items-center">
      <Spin spinning={loading}>
        <div className="flex justify-between items-center w-full">
          <div>
            <Typography.Text className="text-gray-500">{title}</Typography.Text>
            <Typography.Title level={3} className="m-0">
              {displayValue?.toLocaleString()}
            </Typography.Title>
          </div>
          {icon && <div className="text-2xl text-blue-500">{icon}</div>}
        </div>
      </Spin>
    </Card>
  );
};

export default StatCard;