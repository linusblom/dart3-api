import Router from 'koa-router';

import { CurrentGameController } from '../controllers';
import { pin, validate, gameStarted } from '../middlewares';
import { createTeamPlayerSchema, createRoundSchema, startGameSchema } from '../schemas';

const router = new Router();
const ctrl = new CurrentGameController();

router
  .get('/', async (ctx) => await ctrl.get(ctx, ctx.state.service))
  .delete('/', gameStarted(false), async (ctx) => await ctrl.delete(ctx, ctx.state.service))
  .post(
    '/player',
    gameStarted(false),
    validate(createTeamPlayerSchema),
    pin({ allowDisabled: true }),
    async (ctx) =>
      await ctrl.createTeamPlayer(ctx, ctx.state.service, ctx.state.userId, ctx.request.body),
  )
  .delete(
    '/player/:uid',
    gameStarted(false),
    async (ctx) =>
      await ctrl.deleteTeamPlayer(ctx, ctx.state.service, ctx.params.uid, ctx.state.userId),
  )
  .patch(
    '/start',
    gameStarted(false),
    validate(startGameSchema),
    async (ctx) => await ctrl.start(ctx, ctx.state.service, ctx.request.body),
  )
  .get('/match', gameStarted(true), async (ctx) => await ctrl.getMatches(ctx, ctx.state.service))
  .post(
    '/round',
    gameStarted(true),
    validate(createRoundSchema),
    async (ctx) =>
      await ctrl.createRound(ctx, ctx.state.service, ctx.state.userId, ctx.request.body),
  );

export default router;
