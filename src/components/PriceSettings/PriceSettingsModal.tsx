import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Descriptions, message, Select } from 'antd';
import { updateProductPriceSettings } from '@/services/settingsService';
import { getAgentList } from '@/services/agentService';
import { useRequest } from 'ahooks';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo } from '@/types/agent';
import { getMappedValue, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';
import { debug } from '@/utils/debug';

interface PriceSettingsModalProps {
  visible: boolean;
  initialData: ProductPrice | null;
  minAgentPrice: number;  // 添加最低代理价格属性
  onSuccess: () => void;
  onCancel: () => void;
}

const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({
  visible,
  initialData,
  minAgentPrice,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  const { data: agentData } = useRequest(() => getAgentList({ page: 1, pageSize: 1000 }));
  const agents = agentData?.list || [];

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        price: initialData.price,
        minAgentPrice: initialData.minAgentPrice || minAgentPrice,
      });
    }
  }, [visible, initialData, form, minAgentPrice]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!initialData?.id) {
        throw new Error('无效的产品ID');
      }

      await updateProductPriceSettings(initialData.id, {
        price: values.price,
        minAgentPrice: values.minAgentPrice,
        proxyType: initialData.proxyType
      });

      onSuccess();
      message.success('更新成功');
    } catch (error: any) {
      debug.error('更新价格失败:', error);
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedAgent(null);
    onCancel();
  };

  const handleAgentChange = (value: number | null) => {
    setSelectedAgent(value);
    if (value && initialData) {
      // 如果选择了代理商，默认设置为全局价格的120%
      const suggestedPrice = Number((initialData.price * 1.2).toFixed(1));
      // 确保建议价格不低于最低代理价格
      const finalPrice = Math.max(suggestedPrice, minAgentPrice);
      form.setFieldsValue({
        price: finalPrice
      });
    } else if (initialData) {
      form.setFieldsValue({
        price: initialData.price
      });
    }
  };

  return (
    <Modal
      title="价格设置"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item label="代理商">
          <Select
            placeholder="选择代理商"
            allowClear
            value={selectedAgent}
            onChange={handleAgentChange}
            style={{ marginBottom: 16 }}
          >
            {agents.map((agent: AgentInfo) => (
              <Select.Option key={agent.id} value={agent.id}>
                {agent.app_username}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="资源类型">
            {initialData ? getMappedValue(PRODUCT_NO_MAP, initialData.type) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="区域">
            {initialData ? getMappedValue(AREA_MAP, initialData.area) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="国家">
            {initialData ? getMappedValue(COUNTRY_MAP, initialData.country) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="城市">
            {initialData ? getMappedValue(CITY_MAP, initialData.city) : '-'}
          </Descriptions.Item>
          {initialData?.ipRange && (
            <Descriptions.Item label="IP段">
              {initialData.ipRange}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="最低代理价格">
            ¥{minAgentPrice}
          </Descriptions.Item>
        </Descriptions>

        <Form.Item
          label="价格"
          name="price"
          rules={[{ required: true, message: '请输入价格' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={1}
            prefix="¥"
          />
        </Form.Item>

        <Form.Item
          label="最低代理价格"
          name="minAgentPrice"
          rules={[{ required: true, message: '请输入最低代理价格' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={1}
            prefix="¥"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PriceSettingsModal; 