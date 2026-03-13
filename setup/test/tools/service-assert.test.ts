import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ServiceAssertionError,
  assertPrividiumApiUp,
  assertZksyncOsIsUp
} from '../../src/tools/service-assert';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('service-assert', () => {
  it('resolves to /api base url when /api/health responds', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url === 'http://localhost:8000/api/health') {
        return new Response('{}', { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    await expect(assertPrividiumApiUp('http://localhost:8000')).resolves.toBe(
      'http://localhost:8000/api'
    );
  });

  it('throws when prividium API health checks fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 503 }));

    await expect(assertPrividiumApiUp('http://localhost:8000')).rejects.toBeInstanceOf(
      ServiceAssertionError
    );
  });

  it('throws on chain id mismatch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result: '6565' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(assertZksyncOsIsUp('http://localhost:5050', 31337n)).rejects.toThrow(
      'Unexpected network id from zksyncos'
    );
  });
});
