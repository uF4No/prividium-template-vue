import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { setDotEnvConfig, extractConfigOptional } = vi.hoisted(() => ({
  setDotEnvConfig: vi.fn(),
  extractConfigOptional: vi.fn()
}));

vi.mock('../../src/tools/config-tools', () => ({
  setDotEnvConfig,
  extractConfigOptional
}));

import { syncEnvFromContractsConfig } from '../../src/tools/env-sync';

const tempDirs: string[] = [];

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('syncEnvFromContractsConfig', () => {
  it('maps config addresses into backend and web env keys', () => {
    extractConfigOptional.mockImplementation((_path: string, key: string) => {
      if (key === 'PRIVIDIUM_CHAIN_ID') return '6565';
      if (key === 'PRIVIDIUM_RPC_URL') return 'http://localhost:5050';
      return undefined;
    });

    const rootPath = mkdtempSync(path.join(tmpdir(), 'env-sync-'));
    tempDirs.push(rootPath);

    const setupPath = path.join(rootPath, 'setup');
    const backendPath = path.join(rootPath, 'backend');
    const webAppPath = path.join(rootPath, 'web-app');
    const setupEnvPath = path.join(setupPath, '.env');
    const contractsConfigPath = path.join(rootPath, 'config', 'contracts.json');
    mkdirSync(path.dirname(contractsConfigPath), { recursive: true });

    writeFileSync(
      contractsConfigPath,
      JSON.stringify(
        {
          sso: {
            webauthnValidator: '0x0000000000000000000000000000000000000001',
            entryPoint: '0x0000000000000000000000000000000000000002',
            factory: '0x0000000000000000000000000000000000000003'
          },
          interop: {
            l1InteropHandler: '0x0000000000000000000000000000000000000004'
          },
          app: {
            Counter: '0x0000000000000000000000000000000000000005'
          }
        },
        null,
        2
      )
    );

    syncEnvFromContractsConfig({
      rootPath,
      setupEnvPath,
      setupPath,
      backendPath,
      webAppPath,
      contractsConfigPath
    });

    expect(setDotEnvConfig).toHaveBeenCalledWith(
      backendPath,
      'SSO_WEBAUTHN_VALIDATOR_CONTRACT',
      '0x0000000000000000000000000000000000000001'
    );
    expect(setDotEnvConfig).toHaveBeenCalledWith(
      webAppPath,
      'VITE_SSO_WEBAUTHN_VALIDATOR',
      '0x0000000000000000000000000000000000000001'
    );
    expect(setDotEnvConfig).toHaveBeenCalledWith(
      webAppPath,
      'VITE_COUNTER_CONTRACT_ADDRESS',
      '0x0000000000000000000000000000000000000005'
    );
    expect(setDotEnvConfig).toHaveBeenCalledWith(webAppPath, 'VITE_SSO_CHAIN_ID', '6565');
    expect(setDotEnvConfig).toHaveBeenCalledWith(
      webAppPath,
      'VITE_SSO_RPC_URL',
      'http://localhost:5050'
    );
  });
});
