import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['test/smoke/**/*.test.ts'],
    exclude: ['test/integration/**/*.test.ts'],
    coverage: {
      enabled: false
    }
  }
});
