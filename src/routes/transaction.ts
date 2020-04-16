import { Context } from 'koa';
import Router from 'koa-router';

import { pin, validate } from '../middlewares';
import { simpleTransactionSchema, transferTransactionSchema } from '../schemas';
import { TransactionController } from '../controllers';

const router = new Router();
const ctrl = new TransactionController();

router
  .post(
    '/:playerId',
    pin,
    validate(simpleTransactionSchema),
    async (ctx: Context) => await ctrl.simple(ctx, ctx.params.playerId, ctx.request.body),
  )
  .post(
    '/:playerId/player/:toPlayerId',
    pin,
    validate(transferTransactionSchema),
    async (ctx: Context) =>
      await ctrl.transfer(
        ctx,
        ctx.state.userId,
        ctx.params.playerId,
        ctx.params.toPlayerId,
        ctx.request.body,
      ),
  );

export default router;
