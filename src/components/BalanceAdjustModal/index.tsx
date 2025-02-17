import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, message } from 'antd';
import { adjustUserBalance } from '@/services/userService';
import { adjustAgentBalance } from '@/services/agentService';
import type { User } from '@/types/user';
import type { AgentInfo } from '@/types/agent';
import { useAuth } from '@/contexts/AuthContext';

interface BalanceAdjustModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  target: User | AgentInfo;
  targetType: 'user' | 'agent';
}

interface BalanceFormValues {
  amount: number;
  remark: string;
}

interface AdjustBalanceResponse {
  code: number;
  msg: string;
  data?: {
    transaction_no: string;
    amount: number;
    old_balance: number;
    new_balance: number;
  };
}

const BalanceAdjustModal: React.FC<BalanceAdjustModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  target,
  targetType
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<number>(0);
  const { user: currentUser } = useAuth();

  // 检查当前用户权限
  const checkPermission = () => {
    try {
      if (!currentUser) {
        console.log('权限检查: 未找到当前用户信息');
        return false;
      }
      
      console.log('权限检查: 当前用户信息', currentUser);
      console.log('权限检查: 目标对象信息', { targetType, target });
      
      // 管理员有所有权限
      if (currentUser.is_admin) {
        console.log('权限检查: 用户是管理员');
        return true;
      }
      
      // 代理商只能调整自己下属用户的额度
      if (targetType === 'user' && currentUser.is_agent) {
        // 检查目标用户是否属于当前代理商
        const targetUser = target as User;
        const hasPermission = Number(targetUser.agent_id) === Number(currentUser.id);
        console.log('权限检查: 代理商调整用户额度', {
          targetUserId: targetUser.id,
          targetAgentId: targetUser.agent_id,
          currentAgentId: currentUser.id,
          hasPermission
        });
        return hasPermission;
      }
      
      // 代理商不能调整其他代理商的额度
      if (targetType === 'agent') {
        console.log('权限检查: 代理商不能调整其他代理商额度');
        return false;
      }
      
      console.log('权限检查: 未匹配任何权限规则');
      return false;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  };

  const handleSubmit = async (values: BalanceFormValues) => {
    console.log('提交表单数据:', values);
    
    if (!checkPermission()) {
      message.error('没有权限进行此操作');
      return;
    }

    try {
      setLoading(true);
      const adjustFn = targetType === 'user' ? adjustUserBalance : adjustAgentBalance;
      console.log('调用调整额度函数:', {
        targetId: Number(target.id),
        amount: values.amount,
        remark: values.remark
      });
      
      const response = await adjustFn(Number(target.id), values.amount, values.remark || '') as AdjustBalanceResponse;
      console.log('调整额度响应:', response);
      
      if (response.code === 0 && response.data) {
        message.success(
          <div>
            额度调整成功
            <br />
            调整前：{response.data.old_balance} 元
            <br />
            调整后：{response.data.new_balance} 元
          </div>
        );
        form.resetFields();
        setPreviewAmount(0);
        onSuccess();
      } else {
        throw new Error(response.msg || '额度调整失败');
      }
    } catch (error: any) {
      console.error('调整额度失败:', error);
      message.error(error.response?.data?.detail || error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`调整${targetType === 'user' ? '用户' : '代理商'}额度`}
      open={visible}
      onCancel={() => {
        form.resetFields();
        setPreviewAmount(0);
        onCancel();
      }}
      footer={null}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item label="当前额度">
          <span>{target.balance || 0} 元</span>
        </Form.Item>
        
        <Form.Item label="调整后金额">
          <span>{(target.balance || 0) + previewAmount} 元</span>
        </Form.Item>

        <Form.Item
          name="amount"
          label="调整金额"
          rules={[
            { required: true, message: '请输入调整金额' },
            { type: 'number', message: '请输入有效的数字' },
            { 
              validator: async (_, value) => {
                if (value <= 0) {
                  throw new Error('调整金额必须大于0');
                }
                // 如果是代理商调整用户额度，检查代理商余额是否足够
                const token = localStorage.getItem('token');
                if (token) {
                  const currentUser = JSON.parse(atob(token.split('.')[1]));
                  if (currentUser.is_agent && value > currentUser.balance) {
                    throw new Error('余额不足');
                  }
                }
              }
            }
          ]}
        >
          <InputNumber
            placeholder="请输入调整金额"
            style={{ width: '100%' }}
            precision={2}
            onChange={(value) => setPreviewAmount(value ? Number(value) : 0)}
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="调整说明"
          rules={[{ required: false }]}
        >
          <Input.TextArea placeholder="请输入调整说明（选填）" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              form.resetFields();
              setPreviewAmount(0);
              onCancel();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BalanceAdjustModal;
