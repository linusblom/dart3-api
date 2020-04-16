import { Context } from 'koa';
import pino from 'pino';

export const logger = (ctx: Context, next: Function) => {
  ctx.logger = pino();

  return next();
};
