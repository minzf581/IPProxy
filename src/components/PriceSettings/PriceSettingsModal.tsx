import React from 'react';
import { Modal, Form, InputNumber, Descriptions, message, Select } from 'antd';
import { updateProductPrice } from '@/services/productInventory';
import { getAgentList } from '@/services/agentService';
import { useRequest } from 'ahooks';
import type { ProductPrice } from '@/types/product';
import type { AgentInfo } from '@/types/agent';
import { getMappedValue, PRODUCT_NO_MAP, AREA_MAP, COUNTRY_MAP, CITY_MAP } from '@/constants/mappings';

interface PriceSettingsModalProps {
  visible: boolean;
  initialData: ProductPrice | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({
  visible,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [selectedAgent, setSelectedAgent] = React.useState<number | null>(null);

  const { data: agentData } = useRequest(() => getAgentList({ page: 1, pageSize: 1000 }));
  const agents = agentData?.list || [];

  // 当弹窗显示时，设置表单初始值
  React.useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        price: selectedAgent ? Number((initialData.price * 1.2).toFixed(1)) : initialData.price
      });
    }
  }, [visible, initialData, form, selectedAgent]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!initialData) {
        message.error('数据错误');
        return;
      }

      setLoading(true);
      await updateProductPrice(initialData.id, {
        price: values.price,
        agentId: selectedAgent
      });

      message.success('价格更新成功');
      onSuccess();
    } catch (error) {
      console.error('更新价格失败:', error);
      message.error('更新价格失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setSelectedAgent(null);
    onCancel();
  };

  // 处理代理商选择
  const handleAgentChange = (value: number | null) => {
    setSelectedAgent(value);
    if (value && initialData) {
      // 如果选择了代理商，默认设置为全局价格的120%
      form.setFieldsValue({
        price: Number((initialData.price * 1.2).toFixed(1))
      });
    } else if (initialData) {
      // 如果取消选择代理商，恢复为全局价格
      form.setFieldsValue({
        price: initialData.price
      });
    }
  };

  return (
    <Modal
      title="修改价格"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      maskClosable={false}
      destroyOnClose
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
        </Descriptions>

        <Form.Item
          name="price"
          label="价格"
          rules={[
            { required: true, message: '请输入价格' },
            { type: 'number', min: 0.1, message: '价格必须大于0.1' },
            { type: 'number', max: 999999.9, message: '价格超出范围' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={1}
            step={0.1}
            prefix="¥"
            placeholder="请输入价格"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PriceSettingsModal; 