import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import {
  mergeContractsConfig,
  readContractsConfig,
  resolveContractsConfigPath,
  writeContractsConfig
} from '../../src/tools/contracts-config';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('contracts-config', () => {
  it('writes and reads config files', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'contracts-config-'));
    tempDirs.push(dir);
    const configPath = path.join(dir, 'contracts.json');

    writeContractsConfig(configPath, {
      sso: { factory: '0x0000000000000000000000000000000000000001' },
      app: { Counter: '0x0000000000000000000000000000000000000002' }
    });

    const loaded = readContractsConfig(configPath);
    expect(loaded?.sso?.factory).toBe('0x0000000000000000000000000000000000000001');
    expect(loaded?.app?.Counter).toBe('0x0000000000000000000000000000000000000002');
  });

  it('resolves relative configured paths using base path', () => {
    const resolved = resolveContractsConfigPath('/repo', '../config/contracts.json', '/repo/setup');
    expect(resolved).toBe(path.join('/repo/setup', '../config/contracts.json'));
  });

  it('merges updates without dropping existing sections', () => {
    const merged = mergeContractsConfig(
      {
        sso: { factory: '0x0000000000000000000000000000000000000001' },
        interop: { l1InteropHandler: '0x0000000000000000000000000000000000000002' },
        app: { Counter: '0x0000000000000000000000000000000000000003' }
      },
      {
        app: { Other: '0x0000000000000000000000000000000000000004' }
      }
    );

    expect(merged.sso?.factory).toBe('0x0000000000000000000000000000000000000001');
    expect(merged.interop?.l1InteropHandler).toBe('0x0000000000000000000000000000000000000002');
    expect(merged.app?.Counter).toBe('0x0000000000000000000000000000000000000003');
    expect(merged.app?.Other).toBe('0x0000000000000000000000000000000000000004');
  });
});
