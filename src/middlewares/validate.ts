import { ObjectSchema, ArraySchema } from '@hapi/joi';
import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';

export const validate = (schema: ObjectSchema | ArraySchema) => async (ctx, next) => {
  try {
    await schema.validateAsync(ctx.request.body);
    return next();
  } catch (err) {
    return errorResponse(ctx, httpStatusCodes.UNPROCESSABLE_ENTITY, err);
  }
};
