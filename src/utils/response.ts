import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

export const response = (ctx: Context, statusCode: number, message?: string): Context => {
  ctx.status = statusCode;
  ctx.body = {
    message: message ? message : httpStatusCodes.getStatusText(statusCode),
  };
  return ctx;
};

export const errorResponse = (ctx: Context, statusCode: number, message?: string) => {
  message = message ? message : httpStatusCodes.getStatusText(statusCode);
  ctx.status = statusCode;
  ctx.body = {
    message,
  };
  ctx.throw(statusCode, message);
};
