import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

const push = vi.hoisted(() => vi.fn());
const authenticate = vi.hoisted(() => vi.fn(async () => true));
const refreshUserProfile = vi.hoisted(() => vi.fn(async () => null));
const selectExistingPasskey = vi.hoisted(() =>
  vi.fn(async () => ({ accountAddress: '0x0000000000000000000000000000000000000001' }))
);
const createNewPasskey = vi.hoisted(() => vi.fn());
const saveAccountAddress = vi.hoisted(() => vi.fn());

const isAuthenticated = ref(false);
const isAuthenticating = ref(false);
const authError = ref<string | null>(null);
const userProfile = ref<any>(null);

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query: {} })
}));

vi.mock('../../src/composables/usePrividium', () => ({
  usePrividium: () => ({
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    getAuthHeaders: () => ({ Authorization: 'Bearer token' }),
    userProfile,
    refreshUserProfile,
    getChain: () => ({}),
    getTransport: () => ({})
  })
}));

vi.mock('../../src/composables/useRpcClient', () => ({
  useRpcClient: () =>
    ref({
      readContract: vi.fn()
    })
}));

vi.mock('../../src/utils/sso/passkeys', () => ({
  createNewPasskey,
  saveAccountAddress,
  selectExistingPasskey
}));

import LoginView from '../../src/views/LoginView.vue';

afterEach(() => {
  vi.clearAllMocks();
  isAuthenticated.value = false;
  isAuthenticating.value = false;
  authError.value = null;
  userProfile.value = null;
});

describe('LoginView', () => {
  it('triggers authenticate flow when unauthenticated', async () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          BaseIcon: true
        }
      }
    });

    const button = wrapper.find('button.btn.btn-l.btn-primary.w-full');
    await button.trigger('click');

    expect(authenticate).toHaveBeenCalled();
  });

  it('supports existing passkey flow when authenticated', async () => {
    isAuthenticated.value = true;
    userProfile.value = {
      userId: 'user-1',
      walletAddresses: ['0x0000000000000000000000000000000000000001'],
      wallets: [{ walletAddress: '0x0000000000000000000000000000000000000001' }]
    };

    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          BaseIcon: true
        }
      }
    });

    const modeButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Use Existing'));
    expect(modeButton).toBeDefined();
    await modeButton?.trigger('click');

    const actionButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Use Existing Passkey'));
    expect(actionButton).toBeDefined();
    await actionButton?.trigger('click');

    expect(selectExistingPasskey).toHaveBeenCalled();
  });
});
