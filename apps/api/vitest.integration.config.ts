import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/integration/helpers/env.ts'],
    globalSetup: ['./tests/integration/helpers/global-setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared/contracts': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
