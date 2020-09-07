import { Context } from 'koa';
import nodeFetch, { RequestInit } from 'node-fetch';
import humps from 'humps';

import { errorResponse } from './response';

export const fetch = async <T = any>(
  ctx: Context,
  url: string,
  init: RequestInit = { method: 'get' },
): Promise<T> => {
  try {
    const response = await nodeFetch(url, init);

    if (!response.ok) {
      return errorResponse(ctx, response.status, response);
    }

    const json = await response.json();
    const camelized: T = humps.camelizeKeys(json) as any;

    return camelized;
  } catch (err) {
    return errorResponse(ctx, err.status, err);
  }
};
