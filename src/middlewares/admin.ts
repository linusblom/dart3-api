import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';
import { db } from '../database';

export const admin = async (ctx, next) => {
  const pin = ctx.get('x-pin');

  if (!/^[0-9]{4}$/.test(pin)) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  try {
    await db.player.findIdByAdmin(ctx.state.userId, pin);
    return next();
  } catch (err) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }
};
