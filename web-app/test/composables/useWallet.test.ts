import { beforeEach, describe, expect, it, vi } from 'vitest';

const connect = vi.hoisted(() => vi.fn());
const disconnect = vi.hoisted(() => vi.fn());
const getAccount = vi.hoisted(() => vi.fn());
const getChainId = vi.hoisted(() => vi.fn());
const watchAccount = vi.hoisted(() => vi.fn());
const metaMask = vi.hoisted(() => vi.fn(() => ({ id: 'metaMask' })));
const getWalletRpcUrl = vi.hoisted(() => vi.fn(async () => 'http://localhost:5050/rpc/wallet/token'));

vi.mock('@wagmi/core', () => ({
  connect,
  disconnect,
  getAccount,
  getChainId,
  watchAccount
}));

vi.mock('@wagmi/connectors', () => ({
  metaMask
}));

vi.mock('../../src/composables/usePrividium', () => ({
  usePrividium: () => ({
    getWalletRpcUrl
  })
}));

vi.mock('../../src/wagmi', () => ({
  config: {},
  prividiumChain: {
    id: 6565,
    name: 'Prividium',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
}));

describe('useWallet', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('connects and disconnects wallet state', async () => {
    const accountState = {
      isConnected: false,
      address: undefined,
      chainId: 6565
    };

    getAccount.mockImplementation(() => ({ ...accountState }));
    getChainId.mockImplementation(() => accountState.chainId ?? 6565);
    watchAccount.mockImplementation(() => {});

    connect.mockImplementation(async () => {
      accountState.isConnected = true;
      accountState.address = '0x0000000000000000000000000000000000000001';
    });

    disconnect.mockImplementation(async () => {
      accountState.isConnected = false;
      accountState.address = undefined;
    });

    const { useWallet } = await import('../../src/composables/useWallet');
    const wallet = useWallet();

    await wallet.connectWallet();
    expect(wallet.isConnected.value).toBe(true);
    expect(wallet.address.value).toBe('0x0000000000000000000000000000000000000001');

    await wallet.disconnectWallet();
    expect(wallet.isConnected.value).toBe(false);
  });

  it('ensures correct network by switching chain when needed', async () => {
    const accountState = {
      isConnected: true,
      address: '0x0000000000000000000000000000000000000001',
      chainId: 1
    };

    getAccount.mockImplementation(() => ({ ...accountState }));
    getChainId.mockImplementation(() => accountState.chainId ?? 1);
    watchAccount.mockImplementation(() => {});

    let chainIdHex = '0x1';
    const request = vi.fn(async ({ method, params }: { method: string; params?: any[] }) => {
      if (method === 'eth_chainId') {
        return chainIdHex;
      }
      if (method === 'wallet_switchEthereumChain') {
        chainIdHex = params?.[0]?.chainId ?? '0x19a5';
        accountState.chainId = Number.parseInt(chainIdHex, 16);
        return null;
      }
      if (method === 'wallet_addEthereumChain') {
        return null;
      }
      return null;
    });

    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: { request }
    });

    const { useWallet } = await import('../../src/composables/useWallet');
    const wallet = useWallet();

    const isReady = await wallet.ensureWalletReady();

    expect(isReady).toBe(true);
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x19a5' }]
    });
  });
});
