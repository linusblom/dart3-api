import Router from 'koa-router';

import { validate, gameService } from '../middlewares';
import { createGameSchema } from '../schemas';
import { GameController } from '../controllers';
import current from './current-game';

const router = new Router();
const ctrl = new GameController();

router
  .use('/current', gameService, current.routes(), current.allowedMethods())
  .post(
    '/',
    validate(createGameSchema),
    async (ctx) => await ctrl.create(ctx, ctx.state.userId, ctx.request.body),
  )
  .get('/:uid', async (ctx) => await ctrl.getByUid(ctx, ctx.state.userId, ctx.params.uid));

export default router;
