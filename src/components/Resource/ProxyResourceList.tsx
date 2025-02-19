import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Table, Card, Typography, Tag, Space, Button, message, Alert, Modal } from 'antd';
import type { ProxyResource } from '@/types/resource';
import { getProxyResources } from '@/services/api';
import { formatBytes } from '@/utils/format';

const { Text } = Typography;

export interface ProxyResourceListRef {
  fetchResources: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ProxyResourceListProps {
  userId?: number;
  username?: string;
}

const ProxyResourceList = forwardRef<ProxyResourceListRef, ProxyResourceListProps>(({ userId, username }, ref) => {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<ProxyResource[]>([]);
  const [error, setError] = useState<string | null>(null);

  console.log('[ProxyResourceList] 组件渲染:', {
    props: { userId, username },
    state: {
      loading,
      resourceCount: resources.length,
      hasError: Boolean(error)
    }
  });

  const fetchResources = async () => {
    if (!userId) {
      const errorMsg = '缺少必要的用户信息';
      console.error('[ProxyResourceList] 参数验证失败:', {
        userId,
        error: errorMsg,
        stack: new Error().stack
      });
      setError(errorMsg);
      return;
    }

    console.log('[ProxyResourceList] 开始获取代理资源列表:', {
      userId,
      username,
      currentState: {
        loading,
        resourceCount: resources.length,
        hasError: Boolean(error)
      },
      timestamp: new Date().toISOString()
    });
    
    setLoading(true);
    setError(null);

    try {
      console.log('[ProxyResourceList] 调用 API 获取资源:', {
        timestamp: new Date().toISOString(),
        callStack: new Error().stack
      });

      const { data: response } = await getProxyResources();
      
      console.log('[ProxyResourceList] API 响应详情:', {
        fullResponse: response,
        responseType: typeof response,
        hasData: Boolean(response?.data),
        dataType: typeof response?.data,
        code: response?.code,
        timestamp: new Date().toISOString()
      });

      // 验证响应格式
      if (!response || typeof response.code !== 'number') {
        console.error('[ProxyResourceList] 响应格式验证失败:', {
          response,
          responseType: typeof response,
          codeType: typeof response?.code,
          stack: new Error().stack
        });
        throw new Error('服务器返回了无效的数据格式');
      }

      // 验证响应状态
      if (response.code !== 0) {
        console.error('[ProxyResourceList] 响应状态验证失败:', {
          code: response.code,
          message: response.message,
          expectedCode: 0,
          stack: new Error().stack
        });
        throw new Error(response.message || '获取代理资源失败');
      }

      // 验证数据数组
      if (!Array.isArray(response.data)) {
        console.error('[ProxyResourceList] 数据类型验证失败:', {
          data: response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          stack: new Error().stack
        });
        throw new Error('返回的资源列表格式不正确');
      }

      console.log('[ProxyResourceList] 原始资源数据:', {
        dataLength: response.data.length,
        firstItem: response.data[0],
        allData: response.data,
        timestamp: new Date().toISOString()
      });
      
      // 验证每个资源对象的格式
      const validResources = response.data.filter(resource => {
        if (!resource || typeof resource !== 'object') {
          console.warn('[ProxyResourceList] 无效的资源数据:', {
            resource,
            resourceType: typeof resource,
            stack: new Error().stack
          });
          return false;
        }

        const requiredFields = [
          'orderNo',
          'appOrderNo',
          'username',
          'ipipvUsername',
          'proxyIp',
          'proxyPort'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in resource));
        
        if (missingFields.length > 0) {
          console.warn('[ProxyResourceList] 资源数据缺失必要字段:', {
            resource,
            missingFields,
            availableFields: Object.keys(resource),
            stack: new Error().stack
          });
          return false;
        }
        
        return true;
      });

      console.log('[ProxyResourceList] 数据验证结果:', {
        originalCount: response.data.length,
        validCount: validResources.length,
        firstValidResource: validResources[0],
        allValidResources: validResources,
        timestamp: new Date().toISOString()
      });
      
      setResources(validResources);
      
      if (validResources.length === 0) {
        console.warn('[ProxyResourceList] 没有有效的资源数据:', {
          originalData: response.data,
          timestamp: new Date().toISOString()
        });
        setError('暂无可用的代理资源');
      }
    } catch (error: any) {
      console.error('[ProxyResourceList] 处理异常:', {
        error,
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = '获取代理资源失败';
      
      if (error.message.includes('无效的数据格式')) {
        errorMessage = '服务器返回了无效的数据格式，请稍后重试';
      } else if (error.message.includes('没有权限')) {
        errorMessage = '您没有权限访问这些资源';
      } else if (error.response?.status === 404) {
        errorMessage = '请求的资源不存在';
      } else if (error.response?.status >= 500) {
        errorMessage = '服务器内部错误，请稍后重试';
      }
      
      console.error('[ProxyResourceList] 设置错误信息:', {
        originalError: error.message,
        displayError: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      message.error(errorMessage);
      setResources([]);
    } finally {
      setLoading(false);
      console.log('[ProxyResourceList] 完成资源获取:', {
        resourceCount: resources.length,
        hasError: Boolean(error),
        loading: false,
        timestamp: new Date().toISOString()
      });
    }
  };

  useImperativeHandle(ref, () => ({
    fetchResources,
    refresh: fetchResources
  }));

  useEffect(() => {
    console.log('[ProxyResourceList] useEffect 触发:', {
      userId,
      username,
      timestamp: new Date().toISOString()
    });
    fetchResources();
  }, [userId, username]);

  const handleExtractAccount = (record: ProxyResource) => {
    Modal.info({
      title: '账号密码信息',
      content: (
        <div>
          <p>IPIPV用户名：{record.ipipvUsername}</p>
          <p>密码：{record.password}</p>
          <p>代理IP：{record.proxyIp}</p>
          <p>代理端口：{record.proxyPort}</p>
          <p>协议：{record.protocol === '1' ? 'HTTP' : 'SOCKS5'}</p>
        </div>
      ),
    });
  };

  const handleExtractAPI = (record: ProxyResource) => {
    Modal.info({
      title: 'API信息',
      content: (
        <div>
          <p>代理服务器：{record.proxyIp}:{record.proxyPort}</p>
          <p>认证信息：{record.ipipvUsername}:{record.password}</p>
          <p>协议：{record.protocol === '1' ? 'HTTP' : 'SOCKS5'}</p>
        </div>
      ),
    });
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'appOrderNo',
      key: 'appOrderNo',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '总流量',
      dataIndex: 'totalFlow',
      key: 'totalFlow',
      render: (flow: number) => formatBytes(flow * 1024 * 1024),
    },
    {
      title: '剩余流量',
      dataIndex: 'balanceFlow',
      key: 'balanceFlow',
      render: (flow: number) => formatBytes(flow * 1024 * 1024),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '3' ? 'green' : 'red'}>
          {status === '3' ? '正常' : '异常'}
        </Tag>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProxyResource) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleExtractAccount(record)}>
            账密提取
          </Button>
          <Button type="link" onClick={() => handleExtractAPI(record)}>
            API提取
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="代理资源列表" 
      extra={
        <Space>
          <Button onClick={fetchResources} loading={loading}>
            刷新
          </Button>
        </Space>
      }
    >
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        loading={loading}
        dataSource={resources}
        columns={columns}
        rowKey="orderNo"
        scroll={{ x: true }}
        locale={{
          emptyText: error ? '加载失败' : '暂无数据'
        }}
      />
    </Card>
  );
});

export default ProxyResourceList; 