import Router from 'koa-router';
import { Context } from 'koa';

import { PlayerController } from '../controllers';
import { validate } from '../middlewares';
import { createPlayerSchema, updatePlayerSchema } from '../schemas';

const router = new Router();
const ctrl = new PlayerController();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.accountId))
  .post(
    '/',
    validate(createPlayerSchema),
    async (ctx: Context) => await ctrl.create(ctx, ctx.state.accountId, ctx.request.body),
  )
  .get(
    '/:playerId',
    async (ctx: Context) => await ctrl.getById(ctx, ctx.state.accountId, ctx.params.playerId),
  )
  .patch(
    '/:playerId',
    validate(updatePlayerSchema),
    async (ctx: Context) =>
      await ctrl.update(ctx, ctx.state.accountId, ctx.params.playerId, ctx.request.body),
  )
  .patch(
    '/:playerId/reset-pin',
    async (ctx: Context) => await ctrl.resetPin(ctx, ctx.state.accountId, ctx.params.playerId),
  )
  .delete(
    '/:playerId',
    async (ctx: Context) => await ctrl.delete(ctx, ctx.state.accountId, ctx.params.playerId),
  );

export default router;
