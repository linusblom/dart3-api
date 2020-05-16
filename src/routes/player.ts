import Router from 'koa-router';
import { Context } from 'koa';

import { PlayerController } from '../controllers';
import { validate, pin } from '../middlewares';
import { createPlayerSchema, updatePlayerSchema, transactionSchema } from '../schemas';

const router = new Router();
const ctrl = new PlayerController();

router
  .get('/', async (ctx: Context) => await ctrl.all(ctx, ctx.state.userId))
  .post(
    '/',
    validate(createPlayerSchema),
    async (ctx: Context) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  )
  .get(
    '/:playerId',
    async (ctx: Context) => await ctrl.findById(ctx, ctx.state.userId, ctx.params.playerId),
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
  )
  .post(
    '/:playerId/deposit',
    pin,
    validate(transactionSchema),
    async (ctx: Context) => await ctrl.deposit(ctx, ctx.params.playerId, ctx.request.body),
  )
  .post(
    '/:playerId/withdrawal',
    pin,
    validate(transactionSchema),
    async (ctx: Context) => await ctrl.withdrawal(ctx, ctx.params.playerId, ctx.request.body),
  )
  .post(
    '/:playerId/transfer/:receiverPlayerId',
    pin,
    validate(transactionSchema),
    async (ctx: Context) =>
      await ctrl.transfer(ctx, ctx.params.playerId, ctx.params.receiverPlayerId, ctx.request.body),
  );

export default router;
