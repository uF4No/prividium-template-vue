import { encodeAbiParameters, encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import AavePoolAbi from '@/utils/abis/IPool.json';
import WethGatewayAbi from '@/utils/abis/IWrappedTokenGatewayV3.json';

const INTEROP_CENTER = vi.hoisted(() => '0xc64315efbdcD90B71B0687E37ea741DE0E6cEFac');

vi.mock('@/utils/constants', () => ({
  L2_INTEROP_CENTER: INTEROP_CENTER
}));

import { extractTxMetadata } from '@/utils/relayer/metadata';

type ShadowOp = {
  target: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
};

function createSystemLogData(ops: ShadowOp[]) {
  const payload = encodeAbiParameters(
    [
      { name: 'l2Caller', type: 'address' },
      {
        name: 'ops',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' }
        ]
      }
    ],
    [INTEROP_CENTER as `0x${string}`, ops]
  );

  return encodeAbiParameters([{ name: 'payload', type: 'bytes' }], [payload]);
}

function createSystemLog(ops: ShadowOp[]) {
  return {
    address: '0x0000000000000000000000000000000000008008',
    topics: ['0x0', `0x${'0'.repeat(24)}${INTEROP_CENTER.slice(2).toLowerCase()}`],
    data: createSystemLogData(ops)
  };
}

describe('extractTxMetadata', () => {
  it('classifies deposit operations', async () => {
    const depositData = encodeFunctionData({
      abi: WethGatewayAbi.abi,
      functionName: 'depositETH',
      args: [
        '0x0000000000000000000000000000000000000011',
        '0x0000000000000000000000000000000000000022',
        0
      ]
    });

    const receipt = {
      logs: [
        createSystemLog([
          {
            target: '0x0000000000000000000000000000000000000101',
            value: 1_000_000_000_000_000_000n,
            data: depositData
          }
        ])
      ]
    } as any;

    await expect(extractTxMetadata(receipt)).resolves.toEqual({ action: 'Deposit', amount: '1' });
  });

  it('classifies withdrawal operations', async () => {
    const withdrawalData = encodeFunctionData({
      abi: AavePoolAbi.abi,
      functionName: 'withdraw',
      args: [
        '0x0000000000000000000000000000000000000033',
        2_000_000_000_000_000_000n,
        '0x0000000000000000000000000000000000000044'
      ]
    });

    const receipt = {
      logs: [
        createSystemLog([
          {
            target: '0x0000000000000000000000000000000000000102',
            value: 0n,
            data: withdrawalData
          }
        ])
      ]
    } as any;

    await expect(extractTxMetadata(receipt)).resolves.toEqual({
      action: 'Withdrawal',
      amount: '2'
    });
  });

  it('returns Unknown when logs do not match interop format', async () => {
    const receipt = {
      logs: [
        {
          address: '0x0000000000000000000000000000000000009999',
          topics: [],
          data: '0x'
        }
      ]
    } as any;

    await expect(extractTxMetadata(receipt)).resolves.toEqual({ action: 'Unknown', amount: '0' });
  });
});
