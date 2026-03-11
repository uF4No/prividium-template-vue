import { describe, expect, it, vi } from 'vitest';

import {
  type AssociateWalletDeps,
  associateWalletWithUser
} from '@/utils/prividium/user-wallet-association';

const USER_ID = 'user_123';
const WALLET = '0x0000000000000000000000000000000000000001';

function createDeps(fetchFn: typeof fetch): Partial<AssociateWalletDeps> {
  return {
    getPrividiumAuthToken: vi.fn().mockResolvedValue('token'),
    fetchFn,
    apiBaseUrl: 'http://localhost:8000/api'
  };
}

describe('associateWalletWithUser', () => {
  it('returns alreadyLinked when wallet already exists (case-insensitive)', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: USER_ID,
          wallets: [{ walletAddress: '0x0000000000000000000000000000000000000001' }]
        }),
        { status: 200 }
      )
    );

    const result = await associateWalletWithUser(USER_ID, WALLET, createDeps(fetchFn));

    expect(result.alreadyLinked).toBe(true);
    expect(result.wallets).toEqual(['0x0000000000000000000000000000000000000001']);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('updates wallets when wallet is missing', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: USER_ID,
            wallets: [{ walletAddress: '0x0000000000000000000000000000000000000002' }]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: USER_ID,
            wallets: [
              { walletAddress: '0x0000000000000000000000000000000000000002' },
              { walletAddress: WALLET }
            ]
          }),
          { status: 200 }
        )
      );

    const result = await associateWalletWithUser(USER_ID, WALLET, createDeps(fetchFn));

    expect(result.alreadyLinked).toBe(false);
    expect(result.wallets).toEqual([
      '0x0000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000001'
    ]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
