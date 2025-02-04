import '@testing-library/jest-dom';

// 设置全局变量
(global as any).jest = jest;

// 设置全局的mock函数
jest.mock('axios');

// 设置全局的测试超时时间
jest.setTimeout(30000); 