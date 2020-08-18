import { Context } from 'koa';
import nodeFetch, { RequestInit } from 'node-fetch';

import { errorResponse } from './response';

export const fetch = async (ctx: Context, url: string, init: RequestInit = { method: 'get' }) => {
  try {
    const response = await nodeFetch(url, init);
    const json = await response.json();

    if (json.statusCode >= 399) {
      return errorResponse(ctx, json.statusCode, json);
    }

    return json;
  } catch (err) {
    return errorResponse(ctx, err.status, err);
  }
};
