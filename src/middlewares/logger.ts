import pino from 'pino';

export const logger = (ctx, next) => {
  ctx.logger = pino({ level: process.env.LOG_LEVEL });

  return next();
};
