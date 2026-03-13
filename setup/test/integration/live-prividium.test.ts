import { describe, expect, it } from 'vitest';

import { assertPrividiumApiUp } from '../../src/tools/service-assert';

const runLiveTests = process.env.RUN_LIVE_PRIVIDIUM_TESTS === '1';

describe('live prividium integration', () => {
  it.skipIf(!runLiveTests)('is disabled (set RUN_LIVE_PRIVIDIUM_TESTS=1 to enable)', () => {
    expect(true).toBe(true);
  });

  it.runIf(runLiveTests)('verifies configured Prividium API availability', async () => {
    const baseUrl = process.env.PRIVIDIUM_API_URL ?? 'http://localhost:8000/api';
    await expect(assertPrividiumApiUp(baseUrl)).resolves.toContain('http');
  });
});
