import { createPrividiumChain, type PrividiumChain, type UserProfile } from 'prividium';
import { ref, computed } from 'vue';

const prividiumSdkChain = {
    id: parseInt(import.meta.env.VITE_CHAIN_ID),
    name: import.meta.env.VITE_CHAIN_NAME,
    nativeCurrency: {
        name: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL,
        symbol: import.meta.env.VITE_NATIVE_CURRENCY_SYMBOL,
        decimals: 18
    },
    blockExplorers: {
        default: {
            name: 'Explorer',
            url: 'https://explorer.zksync.io/'
        }
    }
} as const;

let prividiumInstance: PrividiumChain | null = null;

const isAuthenticated = ref(false);
const isAuthenticating = ref(false);
const userProfile = ref<UserProfile | null>(null);
const authError = ref<string | null>(null);

function initializePrividium(): PrividiumChain {
    if (!prividiumInstance) {
        prividiumInstance = createPrividiumChain({
            clientId: import.meta.env.VITE_CLIENT_ID,
            chain: prividiumSdkChain,
            rpcUrl: import.meta.env.VITE_PROXY_URL,
            authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL,
            redirectUrl: window.location.origin + '/auth-callback.html',
            permissionsApiBaseUrl: import.meta.env.VITE_PERMISSIONS_API_URL,
            onAuthExpiry: () => {
                console.log('Authentication expired');
                isAuthenticated.value = false;
                userProfile.value = null;
            }
        });

        isAuthenticated.value = prividiumInstance.isAuthorized();

        if (isAuthenticated.value) {
            void loadUserProfile();
        }
    }
    return prividiumInstance;
}

async function loadUserProfile() {
    const prividium = initializePrividium();
    try {
        userProfile.value = await prividium.fetchUser();
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        userProfile.value = null;
    }
}

export function usePrividium() {
    const prividium = initializePrividium();

    const userEmail = computed(() => userProfile.value?.displayName || userProfile.value?.userId || null);
    const userName = computed(() => userProfile.value?.displayName || 'User');
    const userRoles = computed(() => userProfile.value?.roles || []);
    const userWallets = computed(() => userProfile.value?.walletAddresses || []);

    async function authenticate() {
        isAuthenticating.value = true;
        authError.value = null;

        try {
            await prividium.authorize({
                scopes: ['wallet:required', 'network:required']
            });
            isAuthenticated.value = true;
            await loadUserProfile();

            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            authError.value = error instanceof Error ? error.message : 'Authentication failed';
            isAuthenticated.value = false;
            return false;
        } finally {
            isAuthenticating.value = false;
        }
    }

    function signOut() {
        prividium.unauthorize();
        isAuthenticated.value = false;
        userProfile.value = null;
        authError.value = null;
    }

    function getAuthHeaders() {
        return prividium.getAuthHeaders();
    }

    function getTransport() {
        return prividium.transport;
    }

    function getChain() {
        return prividium.chain;
    }

    async function enableWalletToken(params: {
        walletAddress: `0x${string}`;
        contractAddress: `0x${string}`;
        nonce: number;
        calldata: `0x${string}`;
    }) {
        return prividium.enableWalletToken(params);
    }

    async function addNetworkToWallet() {
        return prividium.addNetworkToWallet();
    }

    async function getWalletToken() {
        return prividium.getWalletToken();
    }

    async function getWalletRpcUrl() {
        return prividium.getWalletRpcUrl();
    }

    return {
        isAuthenticated: computed(() => isAuthenticated.value),
        isAuthenticating: computed(() => isAuthenticating.value),
        userEmail,
        userName,
        userRoles,
        userWallets,
        authError: computed(() => authError.value),
        userProfile: computed(() => userProfile.value),

        authenticate,
        signOut,
        getAuthHeaders,
        getTransport,
        getChain,
        enableWalletToken,
        addNetworkToWallet,
        getWalletToken,
        getWalletRpcUrl,

        prividium
    };
}
