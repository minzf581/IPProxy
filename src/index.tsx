import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './global.less';
import './index.css';
import App from './App';

// 全局错误处理
const handleError = (error: Error) => {
  console.error('Global error:', error);
  // 在页面上显示错误
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.padding = '10px';
  errorDiv.style.backgroundColor = '#ff0000';
  errorDiv.style.color = '#ffffff';
  errorDiv.style.zIndex = '9999';
  errorDiv.textContent = `Error: ${error.message}`;
  document.body.appendChild(errorDiv);
};

// 设置全局错误处理器
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Window error:', { message, source, lineno, colno, error });
  if (error) handleError(error);
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (event.reason instanceof Error) handleError(event.reason);
});

// 创建一个错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React error boundary caught error:', error, errorInfo);
    handleError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff0000',
          borderRadius: '4px',
          backgroundColor: '#fff5f5'
        }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('Starting React application...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);

  console.log('Rendering app...');
  root.render(
    <ErrorBoundary>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </ErrorBoundary>
  );

  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to start app:', error);
  handleError(error as Error);
}