import React from 'react';
import { useRouteError } from 'react-router-dom';
import { Result, Button } from 'antd';

const ErrorPage: React.FC = () => {
  const error = useRouteError() as any;

  return (
    <Result
      status="404"
      title="404"
      subTitle={error?.statusText || error?.message || '页面未找到'}
      extra={
        <Button type="primary" onClick={() => window.location.href = '/'}>
          返回首页
        </Button>
      }
    />
  );
};

export default ErrorPage;
