import { Context } from 'koa';
import Router from 'koa-router';

import { validate, pin } from '../middlewares';
import { createGameSchema } from '../schemas';
import { GameController } from '../controllers';

const router = new Router();
const ctrl = new GameController();

router
  .get('/', async (ctx: Context) => await ctrl.getCurrentGame(ctx, ctx.state.userId))
  .post(
    '/',
    validate(createGameSchema),
    async (ctx: Context) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  )
  .delete(
    '/:gameId',
    async (ctx: Context) => await ctrl.delete(ctx, ctx.state.userId, ctx.params.gameId),
  )
  .post(
    '/:gameId/player',
    pin,
    async (ctx: Context) =>
      await ctrl.createGamePlayer(ctx, ctx.state.userId, ctx.params.gameId, ctx.request.body),
  );

export default router;
