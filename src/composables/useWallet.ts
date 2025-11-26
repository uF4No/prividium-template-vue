import { computed, ref } from 'vue';
import { connect, disconnect, getAccount, switchChain, watchAccount, watchChainId } from '@wagmi/core';
import { metaMask } from '@wagmi/connectors';
import { config, prividiumChain } from '../wagmi';
import { createWalletClient, custom } from 'viem';

const account = ref(getAccount(config));
const chainId = ref(account.value.chainId ?? 0);
const isConnecting = ref(false);
const error = ref<string | null>(null);

// Computed properties
const isConnected = computed(() => account.value.isConnected);
const address = computed(() => account.value.address);
const isCorrectNetwork = computed(() => chainId.value === prividiumChain.id);

// Wallet client for direct viem interactions
const walletClient = computed(() => {
    if (!isConnected.value || !isCorrectNetwork.value || !window.ethereum) {
        return null;
    }

    return createWalletClient({
        account: account.value.address,
        chain: prividiumChain,
        transport: custom(window.ethereum)
    });
});

export function useWallet() {
    // Watch for account changes
    const unwatchAccount = watchAccount(config, {
        onChange(data) {
            account.value = data;
            chainId.value = data.chainId ?? 0;
        }
    });

    // Watch for chain changes
    const unwatchChain = watchChainId(config, {
        onChange(data) {
            chainId.value = data;
        }
    });

    // Connect wallet
    const connectWallet = async () => {
        try {
            isConnecting.value = true;
            error.value = null;

            const result = await connect(config, {
                connector: metaMask()
            });

            account.value = getAccount(config);
            chainId.value = account.value.chainId ?? 0;

            return result;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to connect wallet';
            throw err;
        } finally {
            isConnecting.value = false;
        }
    };

    // Disconnect wallet
    const disconnectWallet = async () => {
        try {
            await disconnect(config);
            account.value = getAccount(config);
            error.value = null;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to disconnect wallet';
            throw err;
        }
    };

    // Switch to the correct network
    const switchToCorrectNetwork = async () => {
        try {
            error.value = null;
            await switchChain(config, { chainId: prividiumChain.id });
            account.value = getAccount(config);
            chainId.value = account.value.chainId ?? 0;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to switch network';
            throw err;
        }
    };

    // Check if wallet needs to be connected and is on correct network
    const ensureWalletReady = async (): Promise<boolean> => {
        if (!isConnected.value) {
            await connectWallet();
        }

        if (!isCorrectNetwork.value) {
            await switchToCorrectNetwork();
        }

        return isConnected.value && isCorrectNetwork.value;
    };

    // Cleanup function
    const cleanup = () => {
        unwatchAccount?.();
        unwatchChain?.();
    };

    //

    return {
        // State
        account: computed(() => account.value),
        chainId: computed(() => chainId.value),
        isConnecting: computed(() => isConnecting.value),
        error: computed(() => error.value),

        // Computed
        isConnected,
        address,
        isCorrectNetwork,
        walletClient,

        // Actions
        connectWallet,
        disconnectWallet,
        switchToCorrectNetwork,
        ensureWalletReady,
        cleanup,

        // Chain info
        customChain: prividiumChain
    };
}
