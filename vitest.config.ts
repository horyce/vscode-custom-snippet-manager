import { defineConfig } from 'vitest/config';

/**
 * Vitest 测试配置
 * 测试后端 src/ 下的纯函数和服务逻辑，使用临时目录模拟文件系统
 */
export default defineConfig({
  test: {
    // 测试文件匹配规则：test/ 目录下所有 .test.ts 文件
    include: ['test/**/*.test.ts'],
    // 测试环境：使用 node 环境运行后端逻辑测试
    environment: 'node',
    // 全局启用 API（describe/it/expect 等），无需手动 import
    globals: true,
    // 测试超时时间（毫秒），涉及文件 I/O 的测试可能较慢
    testTimeout: 10000,
    // 每个测试文件后恢复 mock，避免跨文件污染
    restoreMocks: true,
  },
});
