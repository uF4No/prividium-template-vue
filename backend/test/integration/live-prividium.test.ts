import { describe, expect, it } from 'vitest';

const runLiveTests = process.env.RUN_LIVE_PRIVIDIUM_TESTS === '1';

describe('live prividium integration', () => {
  it.skipIf(!runLiveTests)('is disabled (set RUN_LIVE_PRIVIDIUM_TESTS=1 to enable)', () => {
    expect(true).toBe(true);
  });

  it.runIf(runLiveTests)('reaches the configured api health endpoint', async () => {
    const baseUrl = process.env.PRIVIDIUM_API_URL ?? 'http://localhost:8000/api';
    const healthUrl = `${baseUrl.replace(/\/+$/, '')}/health`;

    const response = await fetch(healthUrl);
    expect(response.status).toBe(200);
  });
});
