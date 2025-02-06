import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  message,
  Card,
  Space
} from 'antd';
import { useRequest } from 'ahooks';
import { createStaticOrder } from '@/services/staticOrder';
import type { StaticOrderFormData } from '@/types/staticOrder';

const { Option } = Select;

interface StaticOrderFormProps {
  onSuccess?: (orderNo: string) => void;
}

const StaticOrderForm: React.FC<StaticOrderFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { run: submitOrder } = useRequest(createStaticOrder, {
    manual: true,
    onBefore: () => {
      setLoading(true);
    },
    onSuccess: (result) => {
      if (result.code === 0) {
        message.success('订单创建成功');
        form.resetFields();
        onSuccess?.(result.data.orderNo);
      } else {
        message.error(result.msg || '订单创建失败');
      }
    },
    onError: (error) => {
      message.error(error.message || '系统错误');
    },
    onFinally: () => {
      setLoading(false);
    },
  });

  const handleSubmit = async (values: StaticOrderFormData) => {
    try {
      await submitOrder(values);
    } catch (error) {
      console.error('提交订单失败:', error);
    }
  };

  return (
    <Card title="创建静态代理订单" bordered={false}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          quantity: 1,
          duration: 30,
          staticType: '1'
        }}
      >
        <Form.Item
          name="productNo"
          label="产品编号"
          rules={[{ required: true, message: '请选择产品' }]}
        >
          <Select placeholder="请选择产品">
            <Option value="PROD001">美国家庭代理</Option>
            <Option value="PROD002">欧洲家庭代理</Option>
            <Option value="PROD003">亚洲家庭代理</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="region"
          label="地区"
          rules={[{ required: true, message: '请选择地区' }]}
        >
          <Select placeholder="请选择地区">
            <Option value="US">美国</Option>
            <Option value="EU">欧洲</Option>
            <Option value="AS">亚洲</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="country"
          label="国家"
          rules={[{ required: true, message: '请选择国家' }]}
        >
          <Select placeholder="请选择国家">
            <Option value="US">美国</Option>
            <Option value="GB">英国</Option>
            <Option value="DE">德国</Option>
            <Option value="FR">法国</Option>
            <Option value="JP">日本</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="city"
          label="城市"
          rules={[{ required: true, message: '请选择城市' }]}
        >
          <Select placeholder="请选择城市">
            <Option value="LAX">洛杉矶</Option>
            <Option value="NYC">纽约</Option>
            <Option value="LON">伦敦</Option>
            <Option value="PAR">巴黎</Option>
            <Option value="TYO">东京</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="staticType"
          label="代理类型"
          rules={[{ required: true, message: '请选择代理类型' }]}
        >
          <Select placeholder="请选择代理类型">
            <Option value="1">家庭代理</Option>
            <Option value="2">数据中心</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="quantity"
          label="IP数量"
          rules={[{ required: true, message: '请输入IP数量' }]}
        >
          <InputNumber min={1} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="duration"
          label="使用时长(天)"
          rules={[{ required: true, message: '请输入使用时长' }]}
        >
          <InputNumber min={1} max={365} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea rows={4} placeholder="请输入备注信息" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交订单
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StaticOrderForm; 