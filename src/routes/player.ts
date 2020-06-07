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
  .get('/:uid', async (ctx: Context) => await ctrl.findById(ctx, ctx.state.userId, ctx.params.uid))
  .put(
    '/:uid',
    validate(updatePlayerSchema),
    async (ctx: Context) =>
      await ctrl.update(ctx, ctx.state.userId, ctx.params.uid, ctx.request.body),
  )
  .patch(
    '/:uid/reset-pin',
    async (ctx: Context) => await ctrl.resetPin(ctx, ctx.state.userId, ctx.params.uid),
  )
  .delete(
    '/:uid',
    pin,
    async (ctx: Context) => await ctrl.delete(ctx, ctx.state.userId, ctx.params.uid),
  )
  .post(
    '/:uid/deposit',
    pin,
    validate(transactionSchema),
    async (ctx: Context) =>
      await ctrl.deposit(ctx, ctx.state.userId, ctx.params.uid, ctx.request.body),
  )
  .post(
    '/:uid/withdrawal',
    pin,
    validate(transactionSchema),
    async (ctx: Context) =>
      await ctrl.withdrawal(ctx, ctx.state.userId, ctx.params.uid, ctx.request.body),
  )
  .post(
    '/:uid/transfer/:receiverUid',
    pin,
    validate(transactionSchema),
    async (ctx: Context) =>
      await ctrl.transfer(
        ctx,
        ctx.state.userId,
        ctx.params.uid,
        ctx.params.receiverUid,
        ctx.request.body,
      ),
  );

export default router;
