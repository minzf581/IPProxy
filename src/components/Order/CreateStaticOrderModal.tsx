import React from 'react';
import { Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { orderService } from '@/services/orderService';
import type { CreateStaticOrderForm } from '@/types/order';
import type { UserInfo } from '@/types/user';

interface Props {
  visible: boolean;
  onCancel: () => void;
  user: UserInfo | null;
  onSuccess?: () => void;
}

const CreateStaticOrderModal: React.FC<Props> = ({
  visible,
  onCancel,
  user,
  onSuccess
}) => {
  const [form] = Form.useForm<CreateStaticOrderForm>();

  const handleSubmit = async () => {
    if (!user) {
      message.error('用户信息不存在');
      return;
    }

    try {
      const values = await form.validateFields();
      await orderService.createStaticOrder({
        userId: user.id,
        ...values
      });

      message.success('静态订单创建成功');
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('创建静态订单失败:', error);
      message.error('创建静态订单失败');
    }
  };

  return (
    <Modal
      title="创建静态订单"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="duration"
          label="时长（天）"
          rules={[
            { required: true, message: '请输入时长' },
            { type: 'number', min: 1, message: '时长不能小于1天' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            step={1}
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="数量"
          rules={[
            { required: true, message: '请输入数量' },
            { type: 'number', min: 1, message: '数量不能小于1' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            step={1}
          />
        </Form.Item>

        <Form.Item
          name="region"
          label="地区"
        >
          <Select
            allowClear
            placeholder="请选择地区"
            options={[
              { label: '中国', value: 'CN' },
              { label: '美国', value: 'US' },
              { label: '日本', value: 'JP' },
              { label: '韩国', value: 'KR' },
              { label: '香港', value: 'HK' },
              { label: '新加坡', value: 'SG' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateStaticOrderModal;
