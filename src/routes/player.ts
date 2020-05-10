import Router from 'koa-router';
import { Context } from 'koa';

import { PlayerController } from '../controllers';
import { validate, pin } from '../middlewares';
import { createPlayerSchema, updatePlayerSchema } from '../schemas';

const router = new Router();
const ctrl = new PlayerController();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.userId))
  .post(
    '/',
    validate(createPlayerSchema),
    async (ctx: Context) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  )
  .get(
    '/:playerId',
    async (ctx: Context) => await ctrl.getById(ctx, ctx.state.userId, ctx.params.playerId),
  )
  .put(
    '/:playerId',
    validate(updatePlayerSchema),
    async (ctx: Context) =>
      await ctrl.update(ctx, ctx.state.userId, ctx.params.playerId, ctx.request.body),
  )
  .patch(
    '/:playerId/reset-pin',
    async (ctx: Context) => await ctrl.resetPin(ctx, ctx.state.userId, ctx.params.playerId),
  )
  .delete(
    '/:playerId',
    pin,
    async (ctx: Context) => await ctrl.delete(ctx, ctx.state.userId, ctx.params.playerId),
  );

export default router;
