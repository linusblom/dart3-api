import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { db } from '../database';
import { player as sql } from '../database/sql';

export const pin = async (ctx: Context, next: Function) => {
  const pin = ctx.get('x-pin');

  if (!/[0-9]{4}/.test(pin)) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  try {
    await db.one(sql.findByPin, {
      uid: ctx.params.uid || ctx.request.body.uid,
      userId: ctx.state.userId,
      pin,
    });
  } catch (err) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  return next();
};
