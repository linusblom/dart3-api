import Router from 'koa-router';
import { Context } from 'koa';

import { PlayerController } from '../controllers';
import { validate } from '../middlewares';
import { createPlayerSchema } from '../schemas';

const router = new Router();
const ctrl = new PlayerController();

router
  .get('/', async (ctx: Context) => (ctx.body = await ctrl.get(ctx, ctx.state.accountId)))
  .post(
    '/',
    validate(createPlayerSchema),
    async (ctx: Context) =>
      (ctx.body = await ctrl.create(ctx, ctx.state.accountId, ctx.request.body)),
  )
  .get(
    '/:playerId',
    async (ctx: Context) =>
      (ctx.body = await ctrl.getById(ctx, ctx.state.accountId, ctx.params.playerId)),
  );

export default router;
