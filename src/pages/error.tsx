import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate, useRouteError } from 'react-router-dom';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError() as Error;

  return (
    <Result
      status="500"
      title="出错了"
      subTitle={error?.message || '抱歉，服务器出现了一些问题。'}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      }
    />
  );
};

export default ErrorPage;
