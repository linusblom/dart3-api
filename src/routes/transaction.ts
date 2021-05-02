import { TransactionType } from 'dart3-sdk';
import Router from 'koa-router';

import { TransactionController } from '../controllers';
import { pin, validate } from '../middlewares';
import { transactionQuerySchema, transactionSchema } from '../schemas';

const router = new Router();
const ctrl = new TransactionController();

router
  .get(
    '/',
    validate(transactionQuerySchema, 'query'),
    async (ctx) =>
      await ctrl.getByPlayerUid(
        ctx,
        ctx.state.userId,
        ctx.params.uid,
        ctx.query.limit,
        ctx.query.offset,
      ),
  )
  .post(
    '/',
    validate(transactionSchema),
    (ctx, next) => {
      const onlyAdmin = [TransactionType.Deposit, TransactionType.Withdrawal].includes(
        ctx.request.body.type,
      );
      return pin({ onlyAdmin })(ctx, next);
    },
    async (ctx) => await ctrl.create(ctx, ctx.state.userId, ctx.params.uid, ctx.request.body),
  );

export default router;
