import Router from 'koa-router';
import { Context } from 'koa';

export const router = new Router({ prefix: '/api/v1' });

router.get('/test', async (ctx: Context) => (ctx.body = ctx.state.userId));
