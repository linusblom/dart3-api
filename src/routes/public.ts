import Router from 'koa-router';

import { PublicController } from '../controllers';
import { validate } from '../middlewares';
import { verifyEmailSchema } from '../schemas';

const router = new Router();
const ctrl = new PublicController();

router
  .get('/ping', (ctx) => (ctx.body = 'pong'))
  .get(
    '/verify',
    validate(verifyEmailSchema, 'query'),
    async (ctx) => await ctrl.getVerifyEmail(ctx, ctx.query.uid, ctx.query.token),
  )
  .post(
    '/verify',
    validate(verifyEmailSchema),
    async (ctx) => await ctrl.verifyEmail(ctx, ctx.request.body.uid, ctx.request.body.token),
  );

export default router;
