import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['test/integration/**/*.test.ts'],
    exclude: ['test/smoke/**/*.test.ts'],
    coverage: {
      enabled: false
    }
  }
});
