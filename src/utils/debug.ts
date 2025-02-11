import type { ApiResponse, ApiRequestParams } from '@/types/api';

export interface DebugOptions {
  namespace?: string;
  timestamp?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  enabled?: boolean;
}

export class Debug {
  private namespace: string;
  private showTimestamp: boolean;
  private enabled: boolean;

  constructor(options: DebugOptions = {}) {
    this.namespace = options.namespace || 'App';
    this.showTimestamp = options.timestamp !== false;
    this.enabled = options.enabled !== false && import.meta.env.DEV;
  }

  private getPrefix(level: string): string {
    const timestamp = this.showTimestamp ? `[${new Date().toLocaleTimeString()}]` : '';
    return `${timestamp}${this.namespace}:${level}`;
  }

  private formatArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          if (arg instanceof Error) {
            return arg.message;
          }
          const str = JSON.stringify(arg);
          return str.length > 50 ? `${str.slice(0, 50)}...` : str;
        } catch (e) {
          return arg;
        }
      }
      return arg;
    });
  }

  private shouldLog(): boolean {
    return this.enabled;
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      console.log(this.getPrefix('LOG'), ...this.formatArgs(args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      console.info(this.getPrefix('INFO'), ...this.formatArgs(args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      console.warn(this.getPrefix('WARN'), ...this.formatArgs(args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog()) {
      console.error(this.getPrefix('ERROR'), ...this.formatArgs(args));
    }
  }

  trace(message: string): void {
    if (this.shouldLog()) {
      console.log(this.getPrefix('TRACE'), message);
      console.trace();
    }
  }

  group(label: string): void {
    if (this.shouldLog()) {
      console.group(`${this.getPrefix('GROUP')} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      console.groupEnd();
    }
  }

  // API请求调试
  request(config: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: ApiRequestParams;
  }): void {
    if (this.shouldLog()) {
      this.group('API Request');
      this.log(`${config.method} ${config.url}`);
      if (config.params) this.log('Params:', config.params);
      if (config.data) {
        const params = config.data?.params;
        const data = {
          ...config.data,
          params: params && params.length > 30 
            ? `${params.slice(0, 30)}...`
            : params
        };
        this.log('Body:', data);
      }
      this.groupEnd();
    }
  }

  // API响应调试
  response<T>(response: {
    status: number;
    headers?: Record<string, string>;
    data: ApiResponse<T>;
  }): void {
    if (this.shouldLog()) {
      this.group('API Response');
      this.log(`Status: ${response.status}`);
      if (response.data.data) {
        const dataStr = JSON.stringify(response.data.data);
        this.log('Data:', dataStr.length > 50 
          ? `${dataStr.slice(0, 50)}...`
          : dataStr
        );
      }
      this.groupEnd();
    }
  }

  // 错误调试
  logError(error: any): void {
    if (this.shouldLog()) {
      this.group('Error Details');
      this.error('Error:', {
        type: error.constructor.name,
        message: error.message,
        response: error.response && {
          status: error.response.status,
          data: error.response.data
        }
      });
      this.groupEnd();
    }
  }

  // API参数调试
  logApiParams(params: Record<string, any>): void {
    if (this.shouldLog()) {
      this.group('API Parameters');
      this.log('API Params:', params);
      this.groupEnd();
    }
  }
}

export interface DebugNamespaces {
  auth: Debug;
  request: Debug;
  dashboard: Debug;
  layout: Debug;
  api: Debug;
  proxy: Debug;
  order: Debug;
  user: Debug;
  log: (namespace: string, message: string, ...args: any[]) => void;
  info: (namespace: string, message: string, ...args: any[]) => void;
  error: (namespace: string, message: string, ...args: any[]) => void;
  warn: (namespace: string, message: string, ...args: any[]) => void;
}

// 创建调试实例
export const debug: DebugNamespaces = {
  auth: new Debug({ namespace: 'Auth' }),
  request: new Debug({ namespace: 'Request' }),
  dashboard: new Debug({ namespace: 'Dashboard' }),
  layout: new Debug({ namespace: 'Layout' }),
  api: new Debug({ namespace: 'API' }),
  proxy: new Debug({ namespace: 'Proxy' }),
  order: new Debug({ namespace: 'Order' }),
  user: new Debug({ namespace: 'User' }),
  log: (namespace: string, message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`${namespace}:`, message, ...args);
    }
  },
  info: (namespace: string, message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`${namespace}:INFO`, message, ...args);
    }
  },
  error: (namespace: string, message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(`${namespace}:ERROR`, message, ...args);
    }
  },
  warn: (namespace: string, message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(`${namespace}:WARN`, message, ...args);
    }
  }
}; 