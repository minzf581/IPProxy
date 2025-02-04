import React, { useState } from 'react';
import { Card, Table, Tabs, Tag, Button, Space, message } from 'antd';
import { getDynamicOrderList, getStaticOrderList, updateOrder } from '@/services/orderService';
import { getUserById } from '@/services/userService';
import { getResourceById } from '@/services/resourceService';
import type { DynamicOrder, StaticOrder } from '@/types/order';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import DynamicOrderList from './components/DynamicOrderList';
import StaticOrderList from './components/StaticOrderList';
import BalanceRecordList from './components/BalanceRecordList';
import styles from './index.module.less';

const { TabPane } = Tabs;

const OrdersPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const type = new URLSearchParams(location.search).get('type') || 'dynamic';

  const renderContent = () => {
    switch (type) {
      case 'dynamic':
        return <DynamicOrderList />;
      case 'static':
        return <StaticOrderList />;
      case 'balance':
        return <BalanceRecordList />;
      default:
        return <DynamicOrderList />;
    }
  };

  return (
    <Card className={styles.ordersPage}>
      {renderContent()}
    </Card>
  );
};

export default OrdersPage;
