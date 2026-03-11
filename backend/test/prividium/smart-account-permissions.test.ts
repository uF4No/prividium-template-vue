import { describe, expect, it, vi } from 'vitest';

import {
  configureSmartAccountPermissions,
  type SmartAccountPermissionsDeps
} from '@/utils/prividium/smart-account-permissions';

const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000001';

function createDeps(fetchFn: typeof fetch): Partial<SmartAccountPermissionsDeps> {
  return {
    getPrividiumAuthToken: vi.fn().mockResolvedValue('token'),
    fetchFn,
    apiBaseUrl: 'http://localhost:8000/api',
    getModularSmartAccountArtifact: () => ({
      abi: [],
      hasReceive: true,
      functions: [
        {
          type: 'function',
          name: 'setValue',
          inputs: [{ type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable'
        },
        {
          type: 'function',
          name: 'value',
          inputs: [],
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view'
        }
      ]
    })
  };
}

describe('configureSmartAccountPermissions', () => {
  it('ignores 409 already-exists errors when creating permissions', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ contractAddress: CONTRACT_ADDRESS }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response('already exists', { status: 409, statusText: 'Conflict' }))
      .mockResolvedValueOnce(new Response('already exists', { status: 409, statusText: 'Conflict' }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await expect(configureSmartAccountPermissions(CONTRACT_ADDRESS, createDeps(fetchFn))).resolves.toBe(
      undefined
    );

    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  it('throws when permission creation fails with non-conflict error', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ contractAddress: CONTRACT_ADDRESS }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response('backend error', { status: 500, statusText: 'Error' }));

    await expect(
      configureSmartAccountPermissions(CONTRACT_ADDRESS, {
        ...createDeps(fetchFn),
        getModularSmartAccountArtifact: () => ({
          abi: [],
          hasReceive: false,
          functions: [
            {
              type: 'function',
              name: 'setValue',
              inputs: [{ type: 'uint256' }],
              outputs: [],
              stateMutability: 'nonpayable'
            }
          ]
        })
      })
    ).rejects.toThrow('Failed to configure permission');
  });
});
