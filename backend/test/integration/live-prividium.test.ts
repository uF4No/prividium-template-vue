import { describe, expect, it } from 'vitest';

const runLiveTests = process.env.RUN_LIVE_PRIVIDIUM_TESTS === '1';

async function checkHealth(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, '');
  const origin = new URL(normalized).origin;
  const candidateBases = Array.from(new Set([normalized, origin, `${origin}/api`]));
  const probePaths = ['/health', '/readyz'];
  const candidates = candidateBases.flatMap((base) =>
    probePaths.map((path) => `${base.replace(/\/+$/, '')}${path}`)
  );

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return { ok: true, checked: candidates, matched: url } as const;
      }
    } catch {
      // ignore transient connectivity errors and continue checking candidates
    }
  }

  return { ok: false, checked: candidates } as const;
}

describe('live prividium integration', () => {
  it.skipIf(!runLiveTests)('is disabled (set RUN_LIVE_PRIVIDIUM_TESTS=1 to enable)', () => {
    expect(true).toBe(true);
  });

  it.runIf(runLiveTests)('reaches a valid api health endpoint', async () => {
    const baseUrl = process.env.PRIVIDIUM_API_URL ?? 'http://localhost:8000/api';
    const result = await checkHealth(baseUrl);

    expect(result.ok, `No 200 health endpoint found. Checked: ${result.checked.join(', ')}`).toBe(
      true
    );
  });
});
