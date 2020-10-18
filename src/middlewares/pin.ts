import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { db } from '../database';
import { player as sql } from '../database/sql';

export const pin = (allowDisabled: boolean) => async (ctx: Context, next: Function) => {
  const pin = ctx.get('x-pin');

  if (!/^[0-9]{4}$/.test(pin)) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  const player = await db.oneOrNone(sql.findIdByPin, {
    uid: ctx.params.uid || ctx.request.body.uid,
    userId: ctx.state.userId,
    pin,
  });

  if (!player && !allowDisabled) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  } else if (!player) {
    try {
      await db.one(sql.findIdByUid, {
        uid: ctx.params.uid || ctx.request.body.uid,
        userId: ctx.state.userId,
      });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
    }
  }

  return next();
};
