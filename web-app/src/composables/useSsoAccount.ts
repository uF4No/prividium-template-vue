import type { Address } from 'viem';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { loadExistingPasskey } from '../utils/sso/passkeys';
import { usePrividium } from './usePrividium';

const ssoAccount = ref<Address | null>(null);

export function useSsoAccount() {
  const { userWallets } = usePrividium();

  const refresh = () => {
    const profileWallet = userWallets.value?.[0] as Address | undefined;
    ssoAccount.value = profileWallet ?? null;
  };

  onMounted(() => {
    refresh();
    window.addEventListener('storage', refresh);
  });

  onUnmounted(() => {
    window.removeEventListener('storage', refresh);
  });

  watch(userWallets, () => {
    refresh();
  });

  return {
    account: computed(() => ssoAccount.value),
    refresh
  };
}
