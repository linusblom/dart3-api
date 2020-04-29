import { Context } from 'koa';
import Router from 'koa-router';

import { CurrentGameController } from '../controllers';
import { pin, validate } from '../middlewares';
import { createGamePlayerSchema, createRound } from '../schemas';

const router = new Router();
const ctrl = new CurrentGameController();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.gameUtils))
  .delete('/', async (ctx: Context) => await ctrl.delete(ctx, ctx.state.gameUtils))
  .post(
    '/player',
    validate(createGamePlayerSchema),
    pin,
    async (ctx: Context) => await ctrl.createGamePlayer(ctx, ctx.state.gameUtils, ctx.request.body),
  )
  .delete(
    '/player/:playerId',
    async (ctx: Context) =>
      await ctrl.deleteGamePlayer(ctx, ctx.state.gameUtils, ctx.params.playerId),
  )
  .patch('/start', async (ctx: Context) => await ctrl.start(ctx, ctx.state.gameUtils))
  .post(
    '/round',
    validate(createRound),
    async (ctx: Context) => await ctrl.createRound(ctx, ctx.state.gameUtils, ctx.request.body),
  );

export default router;
