import pino from 'pino';

export const logger = (ctx, next) => {
  ctx.logger = pino();

  return next();
};
