import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, Table, Button, Input, Space, message } from 'antd';
import { useRequest } from 'ahooks';
// TODO: 这个导入将被替换为 businessService 中的函数
import { getProxyResources } from '@/services/proxyService';
import type { ProxyResource } from '@/types/proxy';
import styles from './index.module.less';

export interface ResourceListRef {
  refresh: () => void;
}

const ResourceList = forwardRef<ResourceListRef>((props, ref) => {
  const [resources, setResources] = useState<ProxyResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWhitelist, setNewWhitelist] = useState<{ [key: string]: string }>({});

  // 获取资源列表
  const { data, run: fetchResources } = useRequest(getProxyResources, {
    manual: true,
    onSuccess: (result) => {
      if (result.code === 200) {
        setResources(result.data);
      } else {
        message.error(result.msg || '获取资源列表失败');
      }
    },
  });

  // 暴露刷新方法给父组件
  useImperativeHandle(ref, () => ({
    refresh: fetchResources
  }));

  useEffect(() => {
    fetchResources();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '资源类型',
      dataIndex: 'productNo',
      key: 'productNo',
    },
    {
      title: '总流量',
      dataIndex: 'total',
      key: 'total',
      render: (text: number) => `${text} GB`,
    },
    {
      title: '已使用流量',
      dataIndex: 'used',
      key: 'used',
      render: (text: number) => `${text} GB`,
    },
    {
      title: '剩余流量',
      dataIndex: 'balance',
      key: 'balance',
      render: (text: number) => `${text} GB`,
    },
    {
      title: 'IP白名单',
      dataIndex: 'ipWhiteList',
      key: 'ipWhiteList',
      render: (whitelist: string[], record: ProxyResource) => (
        <Space direction="vertical">
          {whitelist.map((ip, index) => (
            <Space key={index}>
              <span>{ip}</span>
              <Button 
                size="small" 
                type="link" 
                danger
                onClick={() => handleDeleteWhitelist(record.productNo, ip)}
              >
                删除
              </Button>
            </Space>
          ))}
          {whitelist.length < 5 && (
            <Space>
              <Input
                placeholder="输入IP地址"
                value={newWhitelist[record.productNo] || ''}
                onChange={(e) => handleWhitelistInputChange(record.productNo, e.target.value)}
                style={{ width: 200 }}
              />
              <Button 
                type="primary" 
                size="small"
                onClick={() => handleAddWhitelist(record.productNo)}
              >
                添加
              </Button>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'IP使用情况',
      key: 'ipUsage',
      render: (_: unknown, record: ProxyResource) => (
        `${record.ipUsed}/${record.ipTotal}`
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ProxyResource) => (
        <Space>
          <Button type="primary" onClick={() => handleApiExtract(record)}>
            API提取
          </Button>
          <Button onClick={() => handleAccountExtract(record)}>
            账密提取
          </Button>
        </Space>
      ),
    },
  ];

  // 处理白名单输入变化
  const handleWhitelistInputChange = (productNo: string, value: string) => {
    setNewWhitelist({
      ...newWhitelist,
      [productNo]: value,
    });
  };

  // 添加白名单（待实现）
  const handleAddWhitelist = (productNo: string) => {
    message.info('添加白名单功能待实现');
  };

  // 删除白名单（待实现）
  const handleDeleteWhitelist = (productNo: string, ip: string) => {
    message.info('删除白名单功能待实现');
  };

  // API提取（待实现）
  const handleApiExtract = (resource: ProxyResource) => {
    message.info('API提取功能待实现');
  };

  // 账密提取（待实现）
  const handleAccountExtract = (resource: ProxyResource) => {
    message.info('账密提取功能待实现');
  };

  return (
    <Card title="已购资源列表" className={styles.resourceList}>
      <Table
        columns={columns}
        dataSource={resources}
        rowKey="productNo"
        loading={loading}
      />
    </Card>
  );
});

export default ResourceList;
