import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createStatusRouter } from '@/api/statusRouter';

function createTestApp(loadPendingTxs: ReturnType<typeof vi.fn>, loadFinalizedTxs: ReturnType<typeof vi.fn>) {
  const app = express();
  app.use(express.json());
  app.use(
    '/status',
    createStatusRouter({
      loadPendingTxs: loadPendingTxs as any,
      loadFinalizedTxs: loadFinalizedTxs as any
    })
  );
  return app;
}

describe('statusRouter', () => {
  it('returns 400 for invalid payload', async () => {
    const app = createTestApp(vi.fn(), vi.fn());

    const response = await request(app).post('/status').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns pending and finalized tx data', async () => {
    const loadPendingTxs = vi.fn().mockReturnValue([{ hash: '0x1' }]);
    const loadFinalizedTxs = vi.fn().mockReturnValue([{ l2TxHash: '0x2' }]);
    const app = createTestApp(loadPendingTxs, loadFinalizedTxs);

    const accountAddress = '0x0000000000000000000000000000000000000001';
    const response = await request(app).post('/status').send({ accountAddress });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.responseObject.pending).toEqual([{ hash: '0x1' }]);
    expect(response.body.responseObject.finalized).toEqual([{ l2TxHash: '0x2' }]);
    expect(loadPendingTxs).toHaveBeenCalledWith(accountAddress);
    expect(loadFinalizedTxs).toHaveBeenCalledWith(accountAddress);
  });
});
