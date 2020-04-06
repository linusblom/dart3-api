import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { queryOne } from '../database';

export const pin = async (ctx: Context, next: Function) => {
  const pin = ctx.get('x-pin');

  if (!/[0-9]{4}/.test(pin)) {
    return errorResponse(ctx, httpStatusCodes.UNAUTHORIZED);
  }

  const player = await queryOne(
    'SELECT id FROM player WHERE id = $1 AND account_id = $2 AND pin = crypt($3, pin)',
    [ctx.params.playerId || ctx.request.body.playerId, ctx.state.accountId, pin],
  );

  return player ? next() : errorResponse(ctx, httpStatusCodes.UNAUTHORIZED);
};
