import { Context } from 'koa';
import Router from 'koa-router';
import multer from '@koa/multer';

import { updateUserSchema } from '../schemas';
import { validate } from '../middlewares';
import { UserController } from '../controllers';

const router = new Router();
const ctrl = new UserController();
const upload = multer();

router
  .get('/', async (ctx: Context) => await ctrl.get(ctx, ctx.state.userId))
  .patch(
    '/',
    validate(updateUserSchema),
    async (ctx: Context) => await ctrl.update(ctx, ctx.state.userId, ctx.request.body),
  )
  .post('/bootstrap', async (ctx: Context) => await ctrl.bootstrap(ctx, ctx.state.userId))
  .post(
    '/upload',
    upload.single('image'),
    async (ctx: Context) => await ctrl.upload(ctx, ctx.state.userId, ctx.file),
  );

export default router;
