import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';
import { db } from '../database';
import { PinOptions } from '../models';
import { Role } from 'dart3-sdk';

export const pin = (options: PinOptions = {}) => async (ctx, next) => {
  const pin = ctx.get('x-pin');
  const uid = ctx.params.uid || ctx.request.body.uid;

  if (!/^[0-9]{4}$/.test(pin) || !uid) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  if (options.onlyAdmin) {
    try {
      const admin = await db.player.findByAdminPin(ctx.state.userId, pin);
      ctx.state = { ...ctx.state, authorizedBy: { ...admin, type: 'admin' } };
      return next();
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
    }
  }

  let player = await db.player.findByPin(ctx.state.userId, uid, pin);

  if (!player && !options.allowDisabled) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  } else if (!player) {
    try {
      player = await db.player.findByUid(ctx.state.userId, uid);

      if (player.roles.includes(Role.Pin)) {
        throw player;
      }
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
    }
  }

  ctx.state = {
    ...ctx.state,
    authorizedBy: {
      id: player.id,
      name: player.name,
      type: options.allowDisabled ? 'none' : 'pin',
    },
  };
  return next();
};
