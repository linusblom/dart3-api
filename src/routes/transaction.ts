import { Context } from 'koa';
import Router from 'koa-router';

import { pin, validate } from '../middlewares';
import { bankToPlayerSchema, playerToPlayerSchema } from '../schemas';
import { TransactionController } from '../controllers';

const router = new Router();
const ctrl = new TransactionController();

router
  .post(
    '/:playerId',
    pin,
    validate(bankToPlayerSchema),
    async (ctx: Context) => await ctrl.bankToPlayer(ctx, ctx.params.playerId, ctx.request.body),
  )
  .post(
    '/:playerId/player/:toPlayerId',
    pin,
    validate(playerToPlayerSchema),
    async (ctx: Context) =>
      await ctrl.playerToPlayer(
        ctx,
        ctx.state.userId,
        ctx.params.playerId,
        ctx.params.toPlayerId,
        ctx.request.body,
      ),
  );

export default router;
