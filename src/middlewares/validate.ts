import { Context } from 'koa';
import { ObjectSchema } from '@hapi/joi';
import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';

export const validate = (schema: ObjectSchema) => async (ctx: Context, next: Function) => {
  try {
    await schema.validateAsync(ctx.request.body);
    return next();
  } catch (err) {
    return errorResponse(ctx, httpStatusCodes.UNPROCESSABLE_ENTITY);
  }
};
