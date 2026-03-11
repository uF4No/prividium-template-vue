import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createDeployAccountRouter } from '@/api/deployAccountRouter';

function createTestApp(deploySmartAccount: ReturnType<typeof vi.fn>) {
  const app = express();
  app.use(express.json());
  app.use('/deploy-account', createDeployAccountRouter({ deploySmartAccount: deploySmartAccount as any }));
  return app;
}

describe('deployAccountRouter', () => {
  it('returns 400 for invalid payload', async () => {
    const deploySmartAccount = vi.fn();
    const app = createTestApp(deploySmartAccount);

    const response = await request(app).post('/deploy-account').send({ userId: 'u1' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(deploySmartAccount).not.toHaveBeenCalled();
  });

  it('returns 500 when post-deploy setup is incomplete', async () => {
    const deploySmartAccount = vi.fn().mockResolvedValue({
      accountAddress: '0x0000000000000000000000000000000000000001',
      permissionsConfigured: false,
      walletAssociated: false,
      walletAddresses: []
    });
    const app = createTestApp(deploySmartAccount);

    const response = await request(app).post('/deploy-account').send({
      userId: 'user-id',
      originDomain: 'http://localhost:3002',
      credentialId: 'credential-id-12345',
      credentialPublicKey: [1, 2, 3]
    });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('post-deploy setup failed');
  });

  it('returns 200 when deploy + setup succeeds', async () => {
    const deploySmartAccount = vi.fn().mockResolvedValue({
      accountAddress: '0x0000000000000000000000000000000000000001',
      permissionsConfigured: true,
      walletAssociated: true,
      walletAddresses: ['0x0000000000000000000000000000000000000001']
    });
    const app = createTestApp(deploySmartAccount);

    const response = await request(app).post('/deploy-account').send({
      userId: 'user-id',
      originDomain: 'http://localhost:3002',
      credentialId: 'credential-id-12345',
      credentialPublicKey: [1, 2, 3]
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.responseObject.accountAddress).toBe(
      '0x0000000000000000000000000000000000000001'
    );
  });
});
