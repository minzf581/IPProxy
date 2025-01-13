import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Spin, message } from 'antd';
import { orderService } from '@/services/dbService';
import type { StaticOrder } from '@/types/order';

interface Props {
  visible: boolean;
  onCancel: () => void;
  order: StaticOrder | null;
}

const UserStaticOrderDetailModal: React.FC<Props> = ({
  visible,
  onCancel,
  order
}) => {
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<StaticOrder | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!order || !visible) return;

      try {
        setLoading(true);
        const detail = await orderService.getStaticOrderDetail(order.id);
        setOrderDetail(detail);
      } catch (error) {
        console.error('获取订单详情失败:', error);
        message.error('获取订单详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [order, visible]);

  if (!order) return null;

  return (
    <Modal
      title="订单详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        {orderDetail && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号" span={2}>
              {orderDetail.orderNo}
            </Descriptions.Item>
            
            <Descriptions.Item label="用户账号">
              {orderDetail.userAccount}
            </Descriptions.Item>
            
            <Descriptions.Item label="代理商">
              {orderDetail.agentName}
            </Descriptions.Item>
            
            <Descriptions.Item label="IP地址">
              {orderDetail.ipAddress}
            </Descriptions.Item>
            
            <Descriptions.Item label="地区">
              {orderDetail.location}
            </Descriptions.Item>
            
            <Descriptions.Item label="创建时间">
              {orderDetail.createdAt}
            </Descriptions.Item>
            
            <Descriptions.Item label="到期时间">
              {orderDetail.expiredAt}
            </Descriptions.Item>
            
            <Descriptions.Item label="备注" span={2}>
              {orderDetail.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Spin>
    </Modal>
  );
};

export default UserStaticOrderDetailModal;