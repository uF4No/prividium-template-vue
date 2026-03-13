import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { type InteropTxRouterDeps, createInteropTxRouter } from '@/api/interopTxRouter';

function createTestApp(
  deps: {
    getReceiptWithL2ToL1?: InteropTxRouterDeps['getReceiptWithL2ToL1'];
    extractTxMetadata?: InteropTxRouterDeps['extractTxMetadata'];
    addPendingTx?: InteropTxRouterDeps['addPendingTx'];
  } = {}
) {
  const app = express();
  app.use(express.json());
  app.use(
    '/new-l1-interop-tx',
    createInteropTxRouter({
      getReceiptWithL2ToL1:
        deps.getReceiptWithL2ToL1 ??
        (vi.fn() as unknown as InteropTxRouterDeps['getReceiptWithL2ToL1']),
      extractTxMetadata:
        deps.extractTxMetadata ?? (vi.fn() as unknown as InteropTxRouterDeps['extractTxMetadata']),
      addPendingTx: deps.addPendingTx ?? (vi.fn() as unknown as InteropTxRouterDeps['addPendingTx'])
    })
  );
  return app;
}

describe('interopTxRouter', () => {
  it('returns 400 for invalid payload', async () => {
    const app = createTestApp();

    const response = await request(app).post('/new-l1-interop-tx').send({ txHash: '0x123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 400 when metadata action is not supported', async () => {
    const getReceiptWithL2ToL1 = vi.fn().mockResolvedValue({});
    const extractTxMetadata = vi.fn().mockResolvedValue({ action: 'Unknown', amount: '0' });
    const addPendingTx = vi.fn();
    const app = createTestApp({ getReceiptWithL2ToL1, extractTxMetadata, addPendingTx });

    const response = await request(app).post('/new-l1-interop-tx').send({
      txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      accountAddress: '0x0000000000000000000000000000000000000001'
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid transaction');
    expect(addPendingTx).not.toHaveBeenCalled();
  });

  it('returns 200 and enqueues valid interop tx', async () => {
    const getReceiptWithL2ToL1 = vi.fn().mockResolvedValue({ receipt: true });
    const extractTxMetadata = vi.fn().mockResolvedValue({ action: 'Deposit', amount: '1.0' });
    const addPendingTx = vi.fn();
    const app = createTestApp({ getReceiptWithL2ToL1, extractTxMetadata, addPendingTx });

    const txHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const accountAddress = '0x0000000000000000000000000000000000000001';
    const response = await request(app).post('/new-l1-interop-tx').send({ txHash, accountAddress });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(addPendingTx).toHaveBeenCalledWith(
      txHash,
      { action: 'Deposit', amount: '1.0' },
      accountAddress
    );
  });

  it('returns 400 when receipt fetching fails', async () => {
    const getReceiptWithL2ToL1 = vi.fn().mockRejectedValue(new Error('rpc down'));
    const extractTxMetadata = vi.fn();
    const addPendingTx = vi.fn();
    const app = createTestApp({ getReceiptWithL2ToL1, extractTxMetadata, addPendingTx });

    const response = await request(app).post('/new-l1-interop-tx').send({
      txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      accountAddress: '0x0000000000000000000000000000000000000001'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
