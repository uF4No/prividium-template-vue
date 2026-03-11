import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClient, extractRes, postApplications } from '../../src/tools/api-client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ApiClient', () => {
  it('returns parsed data for successful requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'app-1', name: 'My App' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const client = new ApiClient({ baseUrl: 'http://localhost:8000/api' });
    const response = await postApplications(client, {
      name: 'My App',
      origin: 'http://localhost:3002',
      oauthRedirectUris: ['http://localhost:3002/auth-callback.html']
    });

    expect(response.error).toBeUndefined();
    expect(response.data?.id).toBe('app-1');
  });

  it('returns error payload for failed requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 404, message: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const client = new ApiClient({ baseUrl: 'http://localhost:8000/api' });
    const response = await client.get('/unknown');

    expect(response.data).toBeUndefined();
    expect(response.error).toEqual({ statusCode: 404, message: 'not found' });
  });

  it('extractRes throws when response contains error', () => {
    expect(() =>
      extractRes({
        response: new Response('{}', { status: 500 }),
        error: { message: 'boom' },
        data: undefined
      })
    ).toThrow('Error received from API');
  });
});
