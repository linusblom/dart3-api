import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

export const errorResponse = (ctx: Context, status: number) =>
  ctx.throw(status, httpStatusCodes.getStatusText(status));

export const response = (ctx: Context, status: number, body?: any) => {
  ctx.status = status;
  ctx.body = body || { message: httpStatusCodes.getStatusText(status) };

  return ctx;
};
