import Router from 'koa-router';

import { PlayerController } from '../controllers';
import { validate, pin } from '../middlewares';
import { createPlayerSchema, updatePlayerSchema } from '../schemas';
import transaction from './transaction';

const router = new Router();
const ctrl = new PlayerController();

router
  .get('/', async (ctx) => await ctrl.get(ctx, ctx.state.userId))
  .post(
    '/',
    validate(createPlayerSchema),
    async (ctx) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  )
  .get('/:uid', async (ctx) => await ctrl.getByUid(ctx, ctx.state.userId, ctx.params.uid))
  .put(
    '/:uid',
    validate(updatePlayerSchema),
    async (ctx) => await ctrl.update(ctx, ctx.state.userId, ctx.params.uid, ctx.request.body),
  )
  .get('/:uid/statistics', async (ctx) => ctrl.statistics(ctx, ctx.state.userId, ctx.params.uid))
  .patch(
    '/:uid/reset-pin',
    async (ctx) => await ctrl.resetPin(ctx, ctx.state.userId, ctx.params.uid),
  )
  .patch(
    '/:uid/disable-pin',
    pin(),
    async (ctx) => await ctrl.disablePin(ctx, ctx.state.userId, ctx.params.uid),
  )
  .post(
    '/:uid/verify',
    async (ctx) => await ctrl.sendEmailVerification(ctx, ctx.state.userId, ctx.params.uid),
  )
  .delete('/:uid', pin(), async (ctx) => await ctrl.delete(ctx, ctx.state.userId, ctx.params.uid))
  .use('/:uid/transaction', transaction.routes(), transaction.allowedMethods());

export default router;
