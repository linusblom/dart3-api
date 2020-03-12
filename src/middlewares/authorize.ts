import { Context } from 'koa';
import * as jwt from 'jsonwebtoken';
import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';

export const authorize = async (ctx: Context, next: Function) => {
  const authorization = ctx.get('authorization');
  const [, token] = /^Bearer\s(.+)$/i.exec(authorization);
  let userId: string;

  if (token) {
    const decoded: any = jwt.decode(token, { complete: true });

    userId = decoded && decoded.payload && decoded.payload.sub;
  }

  if (!userId) {
    return errorResponse(ctx, httpStatusCodes.UNAUTHORIZED);
  }

  ctx.state = { ...ctx.state, userId };

  return next();
};
