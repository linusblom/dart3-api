import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

export const errorResponse = (ctx: Context, statusCode: number) =>
  ctx.throw(statusCode, httpStatusCodes.getStatusText(statusCode));
