import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Request, type Response, type Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendFaucetFunds } from '@/utils/accounts/faucet';
import { createApiResponse } from '@/utils/response/openAPIResponseBuilders';
import { ServiceResponse } from '@/utils/response/serviceResponse';

export const faucetRegistry = new OpenAPIRegistry();
const BodySchema = z.object({ accountAddress: z.string().length(42) });

export type FaucetRouterDeps = {
  sendFaucetFunds: typeof sendFaucetFunds;
};

faucetRegistry.registerPath({
  method: 'post',
  path: '/faucet',
  tags: ['Faucet'],
  responses: {
    ...createApiResponse(z.null(), 'Success', StatusCodes.OK),
    ...createApiResponse(z.null(), 'Bad Request', StatusCodes.BAD_REQUEST)
  }
});

export function createFaucetRouter(deps: Partial<FaucetRouterDeps> = {}): Router {
  const sendFaucetFundsFn = deps.sendFaucetFunds ?? sendFaucetFunds;
  const router = express.Router();
  router.post('/', async (req: Request, res: Response) => {
    const args = req.body;
    console.log('sending funds to:', args);
    let serviceResponse: ServiceResponse<unknown>;
    const parsed = BodySchema.safeParse(args);
    if (!parsed.success) {
      serviceResponse = ServiceResponse.failure('Missing account address', null);
    } else {
      const funded = await sendFaucetFundsFn(parsed.data.accountAddress);
      serviceResponse = ServiceResponse.success('Accounts funded.', { funded });
    }
    res.status(serviceResponse.statusCode).send(serviceResponse);
  });
  return router;
}

export const faucetRouter = createFaucetRouter();
