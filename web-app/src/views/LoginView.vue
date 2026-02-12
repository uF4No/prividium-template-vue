<script setup lang="ts">
import { type Address, type Chain, type Transport, createPublicClient } from 'viem';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseIcon from '../components/BaseIcon.vue';
import { usePrividium } from '../composables/usePrividium';
import { useRpcClient } from '../composables/useRpcClient';
import { DEPLOY_ACCOUNT_ENDPOINT } from '../utils/sso/constants';
import { createNewPasskey, saveAccountAddress, selectExistingPasskey } from '../utils/sso/passkeys';

const router = useRouter();
const route = useRoute();
const {
  isAuthenticated,
  isAuthenticating,
  authError,
  authenticate,
  getAuthHeaders,
  userProfile,
  refreshUserProfile,
  getChain,
  getTransport
} = usePrividium();
const rpcClient = useRpcClient();

const companyName = import.meta.env.VITE_COMPANY_NAME || 'Prividium™';
const companyIcon = import.meta.env.VITE_COMPANY_ICON || 'CubeIcon';

type UserWallet = { walletAddress: string };
type UserRole = { roleName: string };
type UserData = {
  wallets?: UserWallet[];
  walletAddresses?: string[];
  roles?: UserRole[];
  [key: string]: unknown;
};

// Passkey State (post-auth)
const passkeyUsername = ref('');
const passkeyError = ref<string | null>(null);
const passkeyStep = ref<'idle' | 'checking' | 'creating' | 'deploying' | 'linking' | 'done'>(
  'idle'
);

watch(isAuthenticated, (next) => {
  if (next) {
    passkeyError.value = null;
    passkeyStep.value = 'idle';
  }
});

// API to assign wallet to user
async function assignWalletToUser(walletAddress: string) {
  const headers = getAuthHeaders();
  const userId = userProfile.value?.userId;

  if (!userId || !headers) {
    throw new Error('User not authenticated');
  }

  const apiBaseUrl = import.meta.env.VITE_PRIVIDIUM_API_URL?.replace(/\/$/, '');
  const candidates = apiBaseUrl ? [`${apiBaseUrl}/users/${userId}`] : [];

  // 1. Fetch current user data
  let userResponse: Response | null = null;
  let userData: UserData | null = null;

  for (const url of candidates ?? []) {
    userResponse = await fetch(url, { headers });
    if (userResponse.ok) {
      userData = await userResponse.json();
      break;
    }
  }

  if (!userResponse || !userResponse.ok || !userData) {
    throw new Error('Failed to fetch user data');
  }

  // 2. Prepare payload with existing passkeys/wallets + new one
  // Note: The API GET returns objects in wallets [], but PUT expects strings []
  const existingWallets = (userData.wallets ?? []).map((w) => w.walletAddress);
  const newWallets = [...new Set([...existingWallets, walletAddress])]; // unique

  const payload = {
    ...userData,
    wallets: newWallets,
    // Ensure these fields from GET are what PUT expects (remove keys if necessary,
    // but schema says most are required and match)
    // createdAt/updatedAt are usually ignored by server or readonly, but schema required them in PUT?
    // Let's try sending what we got, filtering only immutable system fields if needed.
    // Schema for PUT /users/{id} includes same fields as GET result essentially.
    // Note: 'roles' in GET is Object[], in PUT is String[]. We must map it.
    roles: (userData.roles ?? []).map((r) => r.roleName)
  };

  // 3. Update user
  let updateResponse: Response | null = null;
  for (const url of candidates ?? []) {
    updateResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (updateResponse.ok) {
      break;
    }
  }

  if (!updateResponse || !updateResponse.ok) {
    const error = await updateResponse?.json().catch(() => null);
    throw new Error(error?.message || 'Failed to link wallet');
  }

  console.log('Successfully linked wallet:', walletAddress);
}

async function ensureUserProfileReady(options?: { requireUserId?: boolean }) {
  const requireUserId = options?.requireUserId ?? false;
  if (userProfile.value && (!requireUserId || userProfile.value.userId)) return;

  await refreshUserProfile();

  if (userProfile.value && (!requireUserId || userProfile.value.userId)) return;
  if (!userProfile.value) {
    throw new Error('User profile not available');
  }
  if (requireUserId) {
    throw new Error('User profile missing id');
  }
}

const login = async () => {
  await authenticate();
};

async function redirectAfterAuth() {
  const redirectPath = (route.query.redirect as string) || '/';
  await router.push(redirectPath);
}

const createPasskey = async () => {
  if (!passkeyUsername.value) return;
  passkeyError.value = null;
  passkeyStep.value = 'creating';

  try {
    // 1. Create Passkey
    const creds = await createNewPasskey(passkeyUsername.value);

    // 2. Deploy Account
    passkeyStep.value = 'deploying';

    const response = await fetch(DEPLOY_ACCOUNT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originDomain: window.location.origin,
        credentialId: creds.credentialId,
        credentialPublicKey: creds.credentialPublicKey
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to deploy smart account');
    }

    const data = await response.json();
    const accountAddress = data?.responseObject?.accountAddress ?? data?.accountAddress;
    if (!accountAddress) {
      throw new Error('No account address returned from backend');
    }

    // 3. Save Account & link to user
    saveAccountAddress(accountAddress);
    passkeyStep.value = 'linking';
    await ensureUserProfileReady({ requireUserId: true });
    await assignWalletToUser(accountAddress);
    passkeyStep.value = 'done';

    passkeyUsername.value = '';
    await redirectAfterAuth();
  } catch (e) {
    console.error(e);
    passkeyError.value = e instanceof Error ? e.message : 'Unknown error during passkey creation';
    passkeyStep.value = 'idle';
  }
};

const useExistingPasskey = async () => {
  passkeyError.value = null;
  passkeyStep.value = 'checking';

  try {
    const displayName = passkeyUsername.value || userProfile.value?.displayName || 'User';
    const headers = getAuthHeaders();
    if (!headers) {
      throw new Error('Authentication required');
    }
    if (!userProfile.value) {
      await refreshUserProfile();
    }
    if (!userProfile.value) {
      throw new Error('User profile not available');
    }
    console.debug('[passkeys] profile loaded', userProfile.value);
    const profileWallets = userProfile.value as {
      walletAddresses?: string[];
      wallets?: UserWallet[];
    } | null;
    console.debug('[passkeys] profile wallets (raw)', {
      walletAddresses: profileWallets?.walletAddresses,
      wallets: profileWallets?.wallets
    });
    const profileWalletList = (profileWallets?.wallets ?? []).map((w) => w.walletAddress);
    const linkedWallets = (userProfile.value.walletAddresses ?? profileWalletList).map((w) =>
      w.toLowerCase()
    );
    console.debug('[passkeys] linked wallets (normalized)', linkedWallets);
    if (!linkedWallets.length) {
      throw new Error(
        'No linked wallets found for this user. Create a new passkey first or link a wallet to your profile.'
      );
    }
    const authClient =
      rpcClient.value ??
      createPublicClient({
        chain: getChain() as unknown as Chain,
        transport: getTransport() as unknown as Transport
      });
    console.debug('[passkeys] rpc client', {
      chain: getChain(),
      transport: getTransport()
    });
    const fromAddress = linkedWallets[0] as Address;
    console.debug('[passkeys] using from address', fromAddress);
    const result = await selectExistingPasskey(displayName, authClient, fromAddress);
    console.debug('[passkeys] selectExistingPasskey result', result);
    passkeyStep.value = 'linking';
    const accountAddress = result.accountAddress?.toLowerCase();
    console.debug('[passkeys] passkey account address', accountAddress);
    console.debug(
      '[passkeys] passkey linked?',
      accountAddress ? linkedWallets.includes(accountAddress) : false
    );
    if (accountAddress && !linkedWallets.includes(accountAddress)) {
      const shouldLink = confirm(
        'This passkey account is not linked to your profile yet. Link it now?'
      );
      if (!shouldLink) {
        throw new Error('Passkey account is not linked to your profile.');
      }
      await ensureUserProfileReady({ requireUserId: true });
      await assignWalletToUser(result.accountAddress);
    }
    passkeyStep.value = 'done';
    passkeyUsername.value = '';
    await redirectAfterAuth();
  } catch (e) {
    console.error(e);
    passkeyError.value = e instanceof Error ? e.message : 'Unknown error during passkey selection';
    passkeyStep.value = 'idle';
  }
};
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-6">
    <div class="w-full max-w-md enterprise-card overflow-hidden">
      <div class="p-10">
        <!-- Enterprise Branding -->
        <div class="flex flex-col items-center mb-10">
          <div class="w-16 h-16 bg-slate-900 flex items-center justify-center rounded-full shadow-lg mb-6 text-white">
            <BaseIcon :name="companyIcon" class="w-8 h-8" />
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight text-center">{{ companyName }}</h1>
          <p class="text-slate-500 font-medium mt-2">Prividium™ Gateway</p>
        </div>

        <div class="text-center mb-10">
          <h2 class="text-lg font-semibold text-slate-800 mb-2">
            {{ isAuthenticated ? 'Complete Account Setup' : 'Secure Access' }}
          </h2>
          <p class="text-slate-500 text-sm">
            {{ isAuthenticated ? 'Link a passkey-protected smart account to your Prividium profile.' : 'Please authenticate to access your dashboard.' }}
          </p>
        </div>

        <!-- AUTHENTICATING STATE -->
        <div v-if="isAuthenticating" class="flex flex-col items-center py-8">
          <div class="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin mb-4"></div>
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Authenticating...</p>
        </div>

        <!-- POST-AUTH PASSKEY FLOW -->
        <div v-else-if="isAuthenticated" class="space-y-6">
          <div
            v-if="passkeyStep === 'checking' || passkeyStep === 'creating' || passkeyStep === 'deploying' || passkeyStep === 'linking'"
            class="flex flex-col items-center py-4"
          >
              <div class="w-8 h-8 border-3 border-accent/10 border-t-accent rounded-full animate-spin mb-3"></div>
              <p class="text-slate-500 text-xs uppercase tracking-wider">
                {{
                  passkeyStep === 'checking'
                    ? 'Checking passkey...'
                    : passkeyStep === 'creating'
                      ? 'Creating Passkey...'
                      : passkeyStep === 'deploying'
                        ? 'Deploying Smart Account...'
                        : 'Linking Smart Account...'
                }}
              </p>
          </div>
          <div v-else-if="passkeyStep === 'done'" class="text-center space-y-4">
             <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
               <BaseIcon name="CheckIcon" class="w-6 h-6" />
             </div>
             <p class="text-slate-700 font-medium">Account linked successfully!</p>
          </div>
          <div v-else class="space-y-4">
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wide">Username</label>
              <input 
                v-model="passkeyUsername"
                type="text" 
                placeholder="ex. alice"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                @keyup.enter="createPasskey"
              />
            </div>
             <button 
              @click="createPasskey"
              :disabled="!passkeyUsername"
              class="enterprise-button-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Account
            </button>
            <button 
              @click="useExistingPasskey"
              class="enterprise-button-secondary w-full py-3"
            >
              Use Existing Passkey
            </button>
          </div>
        </div>

        <!-- STANDARD LOGIN STATE -->
        <div v-else class="space-y-6">
          <button 
            @click="login"
            class="enterprise-button-primary w-full py-4 text-base"
          >
            Authenticate via Prividium
          </button>
        </div>

        <div v-if="authError || passkeyError" class="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <BaseIcon name="ExclamationTriangleIcon" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p class="text-xs text-red-700 font-bold leading-relaxed">{{ authError || passkeyError }}</p>
        </div>
      </div>
      
      <div class="bg-slate-50/50 px-8 py-5 flex justify-center items-center gap-2 border-t border-slate-100">
        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by ZKsync Prividium™</p>
      </div>
    </div>
  </div>
</template>
