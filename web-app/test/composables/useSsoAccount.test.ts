import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearStoredSsoState, saveAccountAddress } from '../../src/utils/sso/passkeys';

const userWallets = ref<string[]>([]);

vi.mock('../../src/composables/usePrividium', () => ({
  usePrividium: () => ({
    userWallets
  })
}));

import { useSsoAccount } from '../../src/composables/useSsoAccount';

const TestComponent = defineComponent({
  setup() {
    return useSsoAccount();
  },
  template: '<div />'
});

afterEach(() => {
  clearStoredSsoState();
  userWallets.value = [];
});

describe('useSsoAccount', () => {
  it('keeps account when wallet is linked', async () => {
    saveAccountAddress('0x0000000000000000000000000000000000000001');
    userWallets.value = ['0x0000000000000000000000000000000000000001'];

    const wrapper = mount(TestComponent);

    expect((wrapper.vm as any).account).toBe('0x0000000000000000000000000000000000000001');
    wrapper.unmount();
  });

  it('clears account when linked wallets exclude saved account', async () => {
    saveAccountAddress('0x0000000000000000000000000000000000000001');
    userWallets.value = ['0x0000000000000000000000000000000000000002'];

    const wrapper = mount(TestComponent);

    expect((wrapper.vm as any).account).toBeNull();
    wrapper.unmount();
  });
});
