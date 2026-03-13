import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Request, type Response, type Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { loadFinalizedTxs, loadPendingTxs } from '@/utils/relayer/state';
import { createApiResponse } from '@/utils/response/openAPIResponseBuilders';
import { ServiceResponse } from '@/utils/response/serviceResponse';

export const statusRegistry = new OpenAPIRegistry();
const BodySchema = z.object({ accountAddress: z.string().length(42) });

export type StatusRouterDeps = {
  loadPendingTxs: typeof loadPendingTxs;
  loadFinalizedTxs: typeof loadFinalizedTxs;
};

statusRegistry.registerPath({
  method: 'post',
  path: '/status',
  tags: ['Status'],
  responses: {
    ...createApiResponse(z.null(), 'Success', StatusCodes.OK),
    ...createApiResponse(z.null(), 'Bad Request', StatusCodes.BAD_REQUEST)
  }
});

export function createStatusRouter(deps: Partial<StatusRouterDeps> = {}): Router {
  const loadPendingTxsFn = deps.loadPendingTxs ?? loadPendingTxs;
  const loadFinalizedTxsFn = deps.loadFinalizedTxs ?? loadFinalizedTxs;
  const router = express.Router();
  router.post('/', async (req: Request, res: Response) => {
    const args = req.body;
    console.log('getting status for account:', args);
    let serviceResponse: ServiceResponse<unknown>;
    const parsed = BodySchema.safeParse(args);
    if (!parsed.success) {
      serviceResponse = ServiceResponse.failure('Missing account address', null);
    } else {
      const pending = loadPendingTxsFn(parsed.data.accountAddress as `0x${string}`);
      const finalized = loadFinalizedTxsFn(parsed.data.accountAddress as `0x${string}`);
      serviceResponse = ServiceResponse.success('Fetched status:', { pending, finalized });
    }
    res.status(serviceResponse.statusCode).send(serviceResponse);
  });
  return router;
}

export const statusRouter = createStatusRouter();
