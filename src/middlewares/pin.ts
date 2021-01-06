import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';
import { db } from '../database';

export const pin = (allowDisabled: boolean) => async (ctx, next) => {
  const pin = ctx.get('x-pin');
  const uid = ctx.params.uid || ctx.request.body.uid;

  if (!/^[0-9]{4}$/.test(pin) || !uid) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  const playerId = await db.player.findIdByPin(ctx.state.userId, uid, pin);

  if (!playerId && !allowDisabled) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  } else if (!playerId) {
    try {
      const player = await db.player.findByUid(ctx.state.userId, uid);

      if (!player.pinDisabled) {
        throw player;
      }
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
    }
  }

  return next();
};
