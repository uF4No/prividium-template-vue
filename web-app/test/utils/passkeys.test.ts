import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearStoredSsoState,
  loadExistingPasskey,
  saveAccountAddress,
  savePasskeyCredentials
} from '../../src/utils/sso/passkeys';

const SAMPLE_PASSKEY = {
  credentialId: 'credential-id',
  credentialPublicKey: [1, 2, 3],
  userName: 'alice',
  userDisplayName: 'Alice'
};

describe('passkey storage helpers', () => {
  beforeEach(() => {
    clearStoredSsoState();
  });

  it('saves and loads passkey/account from localStorage', () => {
    savePasskeyCredentials(SAMPLE_PASSKEY as any);
    saveAccountAddress('0x0000000000000000000000000000000000000001');

    const { savedPasskey, savedAccount } = loadExistingPasskey();

    expect(savedPasskey).toEqual(SAMPLE_PASSKEY);
    expect(savedAccount).toBe('0x0000000000000000000000000000000000000001');
  });

  it('clears stored passkey state', () => {
    savePasskeyCredentials(SAMPLE_PASSKEY as any);
    saveAccountAddress('0x0000000000000000000000000000000000000001');

    clearStoredSsoState();

    const { savedPasskey, savedAccount } = loadExistingPasskey();
    expect(savedPasskey).toBeUndefined();
    expect(savedAccount).toBeUndefined();
  });
});
