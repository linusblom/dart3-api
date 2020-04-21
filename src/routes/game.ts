import { Context } from 'koa';
import Router from 'koa-router';

import { validate, currentGame } from '../middlewares';
import { createGameSchema } from '../schemas';
import { GameController } from '../controllers';
import current from './current-game';

const router = new Router();
const ctrl = new GameController();

router
  .use('/current', currentGame, current.routes(), current.allowedMethods())
  .post(
    '/',
    validate(createGameSchema),
    async (ctx: Context) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  );

export default router;
