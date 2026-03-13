import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

type StateModule = typeof import('@/utils/relayer/state');

async function importStateModule(paths: {
  pending: string;
  finalized: string;
}): Promise<StateModule> {
  vi.resetModules();
  vi.doMock('@/utils/constants', () => ({
    PENDING_TXS_FILE: paths.pending,
    FINALIZED_TXS_FILE: paths.finalized
  }));
  return import('@/utils/relayer/state');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('relayer state store', () => {
  it('loads pending txs from JSON containing comments', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'relayer-state-'));
    const paths = {
      pending: path.join(dir, 'pending.json'),
      finalized: path.join(dir, 'finalized.json')
    };

    writeFileSync(
      paths.pending,
      `// heading\n[\n  {"hash":"0x1","accountAddress":"0x0000000000000000000000000000000000000001"}\n]\n/* tail */`
    );

    const state = await importStateModule(paths);
    expect(state.loadPendingTxs()).toEqual([
      { hash: '0x1', accountAddress: '0x0000000000000000000000000000000000000001' }
    ]);
  });

  it('deduplicates pending txs when adding', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'relayer-state-'));
    const paths = {
      pending: path.join(dir, 'pending.json'),
      finalized: path.join(dir, 'finalized.json')
    };

    writeFileSync(paths.pending, '[]');
    writeFileSync(paths.finalized, '[]');

    const state = await importStateModule(paths);

    state.addPendingTx(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      { action: 'Deposit', amount: '1' },
      '0x0000000000000000000000000000000000000001'
    );
    state.addPendingTx(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      { action: 'Deposit', amount: '1' },
      '0x0000000000000000000000000000000000000001'
    );

    const pending = JSON.parse(readFileSync(paths.pending, 'utf8'));
    expect(pending).toHaveLength(1);
  });

  it('does not add tx already present in finalized state', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'relayer-state-'));
    const paths = {
      pending: path.join(dir, 'pending.json'),
      finalized: path.join(dir, 'finalized.json')
    };

    writeFileSync(paths.pending, '[]');
    writeFileSync(
      paths.finalized,
      JSON.stringify([
        {
          l2TxHash: '0x1111111111111111111111111111111111111111111111111111111111111111'
        }
      ])
    );

    const state = await importStateModule(paths);

    state.addPendingTx(
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      { action: 'Deposit', amount: '1' },
      '0x0000000000000000000000000000000000000001'
    );

    expect(state.loadPendingTxs()).toEqual([]);
  });
});
