import { Context } from 'koa';
import Router from 'koa-router';

import { updateUserSchema } from '../schemas';
import { validate } from '../middlewares';
import { UserController } from '../controllers';

const router = new Router();
const ctrl = new UserController();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.userId))
  .patch(
    '/',
    validate(updateUserSchema),
    async (ctx: Context) => await ctrl.update(ctx, ctx.state.userId, ctx.request.body),
  )
  .post('/bootstrap', async (ctx: Context) => await ctrl.bootstrap(ctx, ctx.state.userId));

export default router;
