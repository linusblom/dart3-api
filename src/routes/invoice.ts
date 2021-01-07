import Router from 'koa-router';

import { InvoiceController } from '../controllers';

const router = new Router();
const ctrl = new InvoiceController();

router.get('/', async (ctx) => await ctrl.get(ctx, ctx.state.userId, ctx.query.paid === 'true'));

export default router;
