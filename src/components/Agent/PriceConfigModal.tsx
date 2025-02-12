import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Table, Space, Button, message, Input } from 'antd';
import { updateAgent } from '@/services/agentService';
import { updateProductPrices } from '@/services/productInventory';
import type { UpdateAgentForm } from '@/types/agent';
import type { ProductPrice } from '@/types/product';

interface Props {
  visible: boolean;
  isGlobal?: boolean;
  agent?: {
    id: number;
    price_config?: UpdateAgentForm['price_config'];
  };
  initialPrices?: ProductPrice[];
  onClose: () => void;
}

const PriceConfigModal: React.FC<Props> = ({ 
  visible, 
  isGlobal = false,
  agent,
  initialPrices = [],
  onClose 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      if (isGlobal && initialPrices.length > 0) {
        form.setFieldsValue({ prices: initialPrices });
      } else if (!isGlobal && agent?.price_config) {
        form.setFieldsValue({ prices: agent.price_config });
      }
    }
  }, [visible, isGlobal, agent, initialPrices]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (isGlobal) {
        await updateProductPrices({
          is_global: true,
          prices: values.prices.map((item: ProductPrice) => ({
            id: item.id,
            price: item.price
          }))
        });
        message.success('全局价格设置成功');
      } else if (agent) {
        await updateAgent(agent.id, {
          price_config: values.prices
        });
        message.success('代理商价格设置成功');
      }
      
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('价格设置失败:', error);
      message.error('价格设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditingKey(null);
    onClose();
  };

  const isEditing = (record: ProductPrice) => record.id === editingKey;

  const edit = (record: ProductPrice) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.id);
  };

  const save = async (key: number) => {
    try {
      const row = await form.validateFields();
      const newData = [...initialPrices];
      const index = newData.findIndex(item => key === item.id);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        form.setFieldsValue({ prices: newData });
      }
      setEditingKey(null);
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type === 'dynamic' ? '动态资源' : '静态资源'
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'IP段',
      dataIndex: 'ipRange',
      key: 'ipRange',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (_: any, record: ProductPrice) => {
        const editing = isEditing(record);
        return editing ? (
          <Form.Item
            name="price"
            style={{ margin: 0 }}
            rules={[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 0.1, message: '价格不能小于0.1' }
            ]}
          >
            <InputNumber
              prefix="¥"
              step={0.1}
              precision={1}
            />
          </Form.Item>
        ) : (
          `¥${record.price.toFixed(1)}`
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProductPrice) => {
        const editing = isEditing(record);
        return editing ? (
          <Space>
            <Button
              type="link"
              onClick={() => save(record.id)}
            >
              保存
            </Button>
            <Button
              type="link"
              onClick={() => setEditingKey(null)}
            >
              取消
            </Button>
          </Space>
        ) : (
          <Button
            type="link"
            disabled={editingKey !== null}
            onClick={() => edit(record)}
          >
            修改
          </Button>
        );
      }
    }
  ];

  const title = isGlobal ? '全局价格设置' : '代理商价格设置';

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={1200}
    >
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          dataSource={initialPrices}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Form>
    </Modal>
  );
};

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: 'number' | 'text';
  record: ProductPrice;
  index: number;
  children: React.ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `请输入 ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default PriceConfigModal; 