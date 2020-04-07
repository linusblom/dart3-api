import { Context } from 'koa';
import Router from 'koa-router';

import { Auth0Service } from '../services';

const router = new Router();
const service = new Auth0Service();

router.get('/', async (ctx: Context) => await service.getUser(ctx, ctx.state.userId));

export default router;
