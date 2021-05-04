import { ObjectSchema, ArraySchema } from '@hapi/joi';
import httpStatusCodes from 'http-status-codes';

import { errorResponse } from '../utils';

export const validate = (
  schema: ObjectSchema | ArraySchema,
  type: 'body' | 'query' | 'params' = 'body',
) => async (ctx, next) => {
  try {
    switch (type) {
      case 'body':
        await schema.validateAsync(ctx.request.body);
        break;
      case 'params':
        await schema.validateAsync(ctx.params);
        break;
      case 'query':
        await schema.validateAsync(ctx.query);
        break;
    }

    return next();
  } catch (err) {
    return errorResponse(ctx, httpStatusCodes.UNPROCESSABLE_ENTITY, err);
  }
};
