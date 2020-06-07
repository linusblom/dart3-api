import { Context } from 'koa';
import Router from 'koa-router';

import { CurrentGameController } from '../controllers';
import { pin, validate } from '../middlewares';
import { createTeamPlayerSchema, createRoundSchema } from '../schemas';

const router = new Router();
const ctrl = new CurrentGameController();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.service))
  .delete('/', async (ctx: Context) => await ctrl.delete(ctx, ctx.state.service))
  .post(
    '/player',
    validate(createTeamPlayerSchema),
    pin,
    async (ctx: Context) =>
      await ctrl.createTeamPlayer(ctx, ctx.state.service, ctx.state.userId, ctx.request.body),
  )
  .delete(
    '/player/:uid',
    async (ctx: Context) =>
      await ctrl.deleteTeamPlayer(ctx, ctx.state.service, ctx.params.uid, ctx.state.userId),
  )
  .patch('/start', async (ctx: Context) => await ctrl.start(ctx, ctx.state.service))
  .get('/match', async (ctx: Context) => await ctrl.allMatches(ctx, ctx.state.service))
  .post(
    '/round',
    validate(createRoundSchema),
    async (ctx: Context) => await ctrl.createRound(ctx, ctx.state.service, ctx.request.body),
  );

export default router;
