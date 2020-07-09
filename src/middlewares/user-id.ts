import { Context } from 'koa';
import jwt from 'jsonwebtoken';

import { Token } from '../models';

export const userId = async (ctx: Context, next: Function) => {
  const authorization = ctx.get('authorization');
  const [, token] = /^Bearer\s(.+)$/i.exec(authorization);
  const decoded = jwt.decode(token, { complete: true }) as Token;
  const { sub } = decoded.payload;

  ctx.state = { ...ctx.state, userId: sub };

  return next();
};
