import Router from 'koa-router';

import { JackpotController } from '../controllers';

const router = new Router();
const ctrl = new JackpotController();

router.get('/', async (ctx) => await ctrl.get(ctx, ctx.state.userId));

export default router;
