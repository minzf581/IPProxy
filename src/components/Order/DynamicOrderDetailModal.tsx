import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Tag, Button, InputNumber, message, Spin } from 'antd';
import * as orderService from '@/services/orderService';
import type { DynamicOrder } from '@/types/order';
import { formatDateTime } from '@/utils/dateUtils';

interface Props {
  visible: boolean;
  onCancel: () => void;
  orderId: number;
  onSuccess?: () => void;
}

const DynamicOrderDetailModal: React.FC<Props> = ({
  visible,
  onCancel,
  orderId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<DynamicOrder | null>(null);
  const [renewDuration, setRenewDuration] = useState<number>(60);
  const [renewLoading, setRenewLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (visible && orderId) {
      fetchOrderDetail();
    }
  }, [visible, orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await orderService.getDynamicOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!order) return;

    try {
      setRenewLoading(true);
      await orderService.renewDynamicOrder(order.id, renewDuration);
      message.success('续费成功');
      fetchOrderDetail();
      onSuccess?.();
    } catch (error) {
      console.error('续费失败:', error);
      message.error('续费失败');
    } finally {
      setRenewLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;

    try {
      setCancelLoading(true);
      await orderService.cancelDynamicOrder(order.id);
      message.success('取消成功');
      fetchOrderDetail();
      onSuccess?.();
    } catch (error) {
      console.error('取消失败:', error);
      message.error('取消失败');
    } finally {
      setCancelLoading(false);
    }
  };

  const columns = [
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '密码',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: '地区',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => text || '-'
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (text: string) => text ? formatDateTime(text) : '-'
    }
  ];

  if (!order) return null;

  return (
    <Modal
      title="动态订单详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      <Spin spinning={loading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户账号">
            {order.userAccount}
          </Descriptions.Item>
          <Descriptions.Item label="代理商">
            {order.agentAccount || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            {order.status === 'active' ? (
              <Tag color="success">使用中</Tag>
            ) : order.status === 'expired' ? (
              <Tag color="warning">已过期</Tag>
            ) : (
              <Tag color="error">已取消</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">
            ¥{order.amount.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="使用时长">
            {order.duration}分钟
          </Descriptions.Item>
          <Descriptions.Item label="代理数量">
            {order.quantity}个
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateTime(order.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="到期时间">
            {formatDateTime(order.expiredAt)}
          </Descriptions.Item>
          {order.region && (
            <Descriptions.Item label="地区" span={2}>
              {order.region}
            </Descriptions.Item>
          )}
          {order.remark && (
            <Descriptions.Item label="备注" span={2}>
              {order.remark}
            </Descriptions.Item>
          )}
        </Descriptions>

        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <Table
            columns={columns}
            dataSource={order.proxyList}
            rowKey="id"
            pagination={false}
          />
        </div>

        {order.status === 'active' && (
          <div style={{ textAlign: 'right' }}>
            <InputNumber
              style={{ width: 120, marginRight: 16 }}
              min={1}
              step={1}
              value={renewDuration}
              onChange={value => setRenewDuration(value || 60)}
              addonAfter="分钟"
            />
            <Button
              type="primary"
              onClick={handleRenew}
              loading={renewLoading}
              style={{ marginRight: 16 }}
            >
              续费
            </Button>
            <Button
              danger
              onClick={handleCancel}
              loading={cancelLoading}
            >
              取消订单
            </Button>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default DynamicOrderDetailModal;
