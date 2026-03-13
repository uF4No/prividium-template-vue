import { describe, expect, it } from 'vitest';

const runLiveTests = process.env.RUN_LIVE_PRIVIDIUM_TESTS === '1';

describe('live prividium integration', () => {
  it.skipIf(!runLiveTests)('is disabled (set RUN_LIVE_PRIVIDIUM_TESTS=1 to enable)', () => {
    expect(true).toBe(true);
  });

  it.runIf(runLiveTests)('checks configured backend health endpoint', async () => {
    const backendUrl =
      (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:4340';
    const response = await fetch(`${backendUrl.replace(/\/+$/, '')}/health-check`);
    expect(response.status).toBe(200);
  });
});
