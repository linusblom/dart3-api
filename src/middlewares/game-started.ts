import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';

export const gameStarted = (started: boolean) => async (ctx: Context, next: Function) => {
  if (
    ctx.state.service &&
    ctx.state.service.game &&
    !!ctx.state.service.game.startedAt === started
  ) {
    return next();
  }

  return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
};
