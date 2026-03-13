import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockExecCmd,
  mockCreatePublicClient,
  mockCreateWalletClient,
  mockPrivateKeyToAccount,
  mockHttp,
  mockDefineChain
} = vi.hoisted(() => ({
  mockExecCmd: vi.fn(),
  mockCreatePublicClient: vi.fn(),
  mockCreateWalletClient: vi.fn(),
  mockPrivateKeyToAccount: vi.fn(),
  mockHttp: vi.fn(),
  mockDefineChain: vi.fn()
}));

vi.mock('../../src/tools/exec-cmd', () => ({
  execCmd: mockExecCmd
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: mockPrivateKeyToAccount
}));

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    createPublicClient: mockCreatePublicClient,
    createWalletClient: mockCreateWalletClient,
    defineChain: mockDefineChain,
    http: mockHttp
  };
});

import { deployAndExtractAddress } from '../../src/tools/deploy';

const tempDirs: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  mockExecCmd.mockResolvedValue('');
  mockPrivateKeyToAccount.mockReturnValue({
    address: '0x00000000000000000000000000000000000000aa'
  });
  mockDefineChain.mockReturnValue({});
  mockHttp.mockReturnValue({});
});

function createArtifactDir() {
  const dir = mkdtempSync(path.join(tmpdir(), 'deploy-test-'));
  tempDirs.push(dir);
  const artifactPath = path.join(dir, 'Counter.json');
  writeFileSync(
    artifactPath,
    JSON.stringify({
      abi: [],
      bytecode: {
        object: '0x60006000'
      }
    })
  );
  return { dir, artifactPath: 'Counter.json' };
}

describe('deployAndExtractAddress', () => {
  it('throws when deployer balance is insufficient', async () => {
    const { dir, artifactPath } = createArtifactDir();

    mockCreatePublicClient.mockReturnValue({
      getGasPrice: vi.fn().mockResolvedValue(1n),
      getBalance: vi.fn().mockResolvedValue(500n),
      estimateGas: vi.fn().mockResolvedValue(1_000n)
    });
    mockCreateWalletClient.mockReturnValue({
      deployContract: vi.fn()
    });

    await expect(
      deployAndExtractAddress(dir, artifactPath, {
        rpcUrl: 'http://127.0.0.1:8545',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        chainId: 31337
      })
    ).rejects.toThrow('Insufficient deployer balance');
  });

  it('returns deployed contract address for successful deployment', async () => {
    const { dir, artifactPath } = createArtifactDir();

    const deployHash = '0x1111111111111111111111111111111111111111111111111111111111111111';

    mockCreatePublicClient.mockReturnValue({
      getGasPrice: vi.fn().mockResolvedValue(1n),
      getBalance: vi.fn().mockResolvedValue(50_000n),
      estimateGas: vi.fn().mockResolvedValue(1_000n),
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        status: 'success',
        contractAddress: '0x0000000000000000000000000000000000000abc'
      })
    });
    mockCreateWalletClient.mockReturnValue({
      deployContract: vi.fn().mockResolvedValue(deployHash)
    });

    await expect(
      deployAndExtractAddress(dir, artifactPath, {
        rpcUrl: 'http://127.0.0.1:8545',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        chainId: 31337
      })
    ).resolves.toBe('0x0000000000000000000000000000000000000abc');

    expect(mockExecCmd).toHaveBeenCalledWith('forge soldeer install', dir);
    expect(mockExecCmd).toHaveBeenCalledWith('pnpm build', dir);
  });
});
