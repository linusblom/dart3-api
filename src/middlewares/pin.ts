import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { queryOne } from '../database';

export const pin = async (ctx: Context, next: Function) => {
  const pin = ctx.get('x-pin');

  if (!/[0-9]{4}/.test(pin)) {
    return errorResponse(ctx, httpStatusCodes.FORBIDDEN);
  }

  const [
    player,
    err,
  ] = await queryOne(
    'SELECT id FROM player WHERE id = $1 AND user_id = $2 AND pin = crypt($3, pin)',
    [ctx.params.playerId || ctx.request.body.playerId, ctx.state.userId, pin],
  );

  if (err) {
    return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  return player ? next() : errorResponse(ctx, httpStatusCodes.FORBIDDEN);
};
