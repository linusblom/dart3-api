import { Context } from 'koa';
import Router from 'koa-router';

import { validate, pin } from '../middlewares';
import { createGameSchema } from '../schemas';
import { GameController } from '../controllers';

const router = new Router();
const ctrl = new GameController();

router
  .post(
    '/',
    validate(createGameSchema),
    async (ctx: Context) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  )
  .get('/current', async (ctx: Context) => await ctrl.getCurrentGame(ctx, ctx.state.userId))

  .delete('/current', async (ctx: Context) => await ctrl.deleteCurrentGame(ctx, ctx.state.userId))
  .post(
    '/current/player',
    pin,
    async (ctx: Context) =>
      await ctrl.createCurrentGamePlayer(ctx, ctx.state.userId, ctx.request.body),
  )
  .delete(
    '/current/player/:playerId',
    async (ctx: Context) =>
      await ctrl.deleteCurrentGamePlayer(ctx, ctx.state.userId, ctx.params.playerId),
  );

export default router;
