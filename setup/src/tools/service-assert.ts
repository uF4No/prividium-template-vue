import { z } from 'zod';

export class ServiceAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceAssertionError';
  }
}

function normalizeBaseUrl(rawBaseUrl: string): string {
  return rawBaseUrl.replace(/\/+$/, '');
}

async function checkHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function assertPrividiumApiUp(baseUrl: string): Promise<string> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const base = new URL(normalizedBaseUrl);
  const origin = base.origin;
  const candidates = [
    normalizedBaseUrl,
    new URL('/api', normalizedBaseUrl).toString(),
    origin,
    new URL('/api', origin).toString()
  ];

  for (const candidate of candidates) {
    const healthPaths = [
      new URL('/health', candidate).toString(),
      new URL('/api/health', candidate).toString()
    ];
    for (const path of healthPaths) {
      if (await checkHealth(path)) {
        if (path.endsWith('/api/health')) {
          return normalizeBaseUrl(new URL('/api', candidate).toString());
        }
        return normalizeBaseUrl(candidate);
      }
    }
  }

  throw new ServiceAssertionError(
    'Invalid response from prividium api. Please start local prividium api and try again'
  );
}

const chainIdSchema = z.object({
  result: z.coerce.bigint()
});

export async function assertZksyncOsIsUp(url: string, expectedChainId?: bigint) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'check-if-alive',
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: []
      })
    });

    if (res.status !== 200) {
      throw new ServiceAssertionError('Invalid response from zksyncos. Cannot continue with setup.');
    }

    const json = await res.json();
    const parsed = chainIdSchema.safeParse(json);

    if (!parsed.success) {
      throw new ServiceAssertionError(
        `Unexpected response interacting with rpc: ${JSON.stringify(json)}`
      );
    }
    if (expectedChainId !== undefined && parsed.data.result !== expectedChainId) {
      throw new ServiceAssertionError(
        `Unexpected network id from zksyncos. expected: ${expectedChainId} , received: ${parsed.data.result}`
      );
    }
  } catch (error) {
    if (error instanceof ServiceAssertionError) {
      throw error;
    }
    throw new ServiceAssertionError('zksyncos down. Please start deps and try again');
  }
}
