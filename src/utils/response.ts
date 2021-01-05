import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

export const errorResponse = (ctx: Context, status = 500, error?: any) => {
  const type = status >= 500 ? 'error' : 'info';
  ctx.logger[type]({ status, ...(error && { error: error.stack }) });

  ctx.throw(status, httpStatusCodes.getStatusText(status));
};

export const response = (ctx: Context, status: number, body?: any) => {
  ctx.status = status;
  ctx.body = body;

  return ctx;
};
