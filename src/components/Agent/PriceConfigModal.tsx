import React from 'react';
import { Modal, Form, InputNumber, Tabs, Card, Space, Select, Button, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { updateAgent } from '@/services/agentService';
import type { UpdateAgentForm } from '@/types/agent';

interface Props {
  visible: boolean;
  agent: {
    id: number;
    price_config?: UpdateAgentForm['price_config'];
  };
  onClose: () => void;
}

const { TabPane } = Tabs;

const PriceConfigModal: React.FC<Props> = ({ visible, agent, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && agent.price_config) {
      form.setFieldsValue({
        price_config: agent.price_config
      });
    }
  }, [visible, agent]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await updateAgent(agent.id, {
        price_config: values.price_config
      });
      
      message.success('单价设置成功');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('单价设置失败:', error);
      message.error('单价设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="单价设置"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Tabs defaultActiveKey="dynamic">
          <TabPane tab="动态资源" key="dynamic">
            <Form.List name={['price_config', 'dynamic']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'resourceId']}
                        rules={[{ required: true, message: '请选择资源' }]}
                      >
                        <Select style={{ width: 200 }} placeholder="选择资源">
                          <Select.Option value="resource1">动态资源1</Select.Option>
                          <Select.Option value="resource2">动态资源2</Select.Option>
                          <Select.Option value="resource3">动态资源3</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        rules={[{ required: true, message: '请输入单价' }]}
                      >
                        <InputNumber
                          placeholder="单价(元/GB)"
                          min={0}
                          precision={2}
                          step={0.1}
                        />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加动态资源单价
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </TabPane>
          <TabPane tab="静态资源" key="static">
            <Form.List name={['price_config', 'static']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} style={{ marginBottom: 16 }}>
                      <Space align="start">
                        <Form.Item
                          {...restField}
                          name={[name, 'resourceId']}
                          rules={[{ required: true, message: '请选择资源' }]}
                        >
                          <Select style={{ width: 200 }} placeholder="选择资源">
                            <Select.Option value="static1">静态资源1</Select.Option>
                            <Select.Option value="static2">静态资源2</Select.Option>
                            <Select.Option value="static3">静态资源3</Select.Option>
                            <Select.Option value="static4">静态资源4</Select.Option>
                            <Select.Option value="static5">静态资源5</Select.Option>
                            <Select.Option value="static7">静态资源7</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.List name={[name, 'regions']}>
                          {(subFields, { add: addRegion, remove: removeRegion }) => (
                            <>
                              {subFields.map(({ key: subKey, name: subName, ...restSubField }) => (
                                <Space key={subKey} align="baseline">
                                  <Form.Item
                                    {...restSubField}
                                    name={[subName, 'region']}
                                    rules={[{ required: true, message: '请选择区域' }]}
                                  >
                                    <Select style={{ width: 200 }} placeholder="选择区域">
                                      <Select.Option value="china">中国</Select.Option>
                                      <Select.Option value="usa">美国</Select.Option>
                                      <Select.Option value="europe">欧洲</Select.Option>
                                      <Select.Option value="asia">亚洲</Select.Option>
                                    </Select>
                                  </Form.Item>
                                  <Form.Item
                                    {...restSubField}
                                    name={[subName, 'price']}
                                    rules={[{ required: true, message: '请输入单价' }]}
                                  >
                                    <InputNumber
                                      placeholder="单价(元/IP)"
                                      min={0}
                                      precision={2}
                                      step={0.1}
                                    />
                                  </Form.Item>
                                  <MinusCircleOutlined onClick={() => removeRegion(subName)} />
                                </Space>
                              ))}
                              <Form.Item>
                                <Button type="dashed" onClick={() => addRegion()} block icon={<PlusOutlined />}>
                                  添加区域单价
                                </Button>
                              </Form.Item>
                            </>
                          )}
                        </Form.List>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加静态资源单价
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default PriceConfigModal; 