import Router from 'koa-router';

import { CurrentGameController } from '../controllers';
import { pin, validate } from '../middlewares';
import { Context } from 'koa';
import { createGamePlayerSchema } from '../schemas';

const router = new Router();
const ctrl = new CurrentGameController();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.currentGame))
  .delete('/', async (ctx: Context) => await ctrl.delete(ctx, ctx.state.currentGame))
  .post(
    '/player',
    validate(createGamePlayerSchema),
    pin,
    async (ctx: Context) =>
      await ctrl.createGamePlayer(ctx, ctx.state.currentGame, ctx.request.body),
  )
  .delete(
    '/player/:playerId',
    async (ctx: Context) =>
      await ctrl.deleteGamePlayer(ctx, ctx.state.currentGame, ctx.params.playerId),
  )
  .patch('/start', async (ctx: Context) => await ctrl.start(ctx, ctx.state.currentGame));

export default router;
