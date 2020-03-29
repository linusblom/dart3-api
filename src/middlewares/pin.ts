import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { queryOne } from '../database';

export const pin = async (ctx: Context, next: Function) => {
  const pin = ctx.get('x-pin');

  if (!/[0-9]{4}/.test(pin)) {
    return errorResponse(ctx, httpStatusCodes.UNAUTHORIZED);
  }

  const player = await queryOne('SELECT id FROM player WHERE id = $1 AND pin = crypt($2, pin)', [
    ctx.params.playerId,
    pin,
  ]);

  return player ? next() : errorResponse(ctx, httpStatusCodes.UNAUTHORIZED);
};
