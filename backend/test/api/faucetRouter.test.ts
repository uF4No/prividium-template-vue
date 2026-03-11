import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createFaucetRouter } from '@/api/faucetRouter';

function createTestApp(sendFaucetFunds: ReturnType<typeof vi.fn>) {
  const app = express();
  app.use(express.json());
  app.use('/faucet', createFaucetRouter({ sendFaucetFunds: sendFaucetFunds as any }));
  return app;
}

describe('faucetRouter', () => {
  it('returns 400 for invalid payload', async () => {
    const sendFaucetFunds = vi.fn();
    const app = createTestApp(sendFaucetFunds);

    const response = await request(app).post('/faucet').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(sendFaucetFunds).not.toHaveBeenCalled();
  });

  it('returns 200 and funded payload for valid account', async () => {
    const sendFaucetFunds = vi.fn().mockResolvedValue({
      entryPoint: true,
      ssoAccount: false,
      shadowAccount: false
    });
    const app = createTestApp(sendFaucetFunds);

    const accountAddress = '0x0000000000000000000000000000000000000001';
    const response = await request(app).post('/faucet').send({ accountAddress });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.responseObject.funded.entryPoint).toBe(true);
    expect(sendFaucetFunds).toHaveBeenCalledWith(accountAddress);
  });
});
