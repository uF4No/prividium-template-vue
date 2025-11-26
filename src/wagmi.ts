import { createConfig, http } from '@wagmi/core';
import { metaMask } from '@wagmi/connectors';
import { defineChain } from 'viem';
import { zksync } from 'viem/chains';

export const prividiumChain = defineChain({
    ...zksync,
    id: parseInt(import.meta.env.VITE_CHAIN_ID),
    name: import.meta.env.VITE_CHAIN_NAME,
    nativeCurrency: {
        name: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL,
        symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL,
        decimals: 18
    },
    rpcUrls: {
        default: {
            http: [import.meta.env.VITE_PROXY_URL]
        },
        public: {
            http: [import.meta.env.VITE_PROXY_URL]
        }
    }
});

export function createWagmiConfig(walletRpcUrl?: string) {
    const rpcUrl = walletRpcUrl || import.meta.env.VITE_PROXY_URL;

    return createConfig({
        chains: [prividiumChain],
        connectors: [metaMask()],
        transports: {
            [prividiumChain.id]: http(rpcUrl)
        }
    });
}

export const config = createWagmiConfig();
