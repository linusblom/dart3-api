import { Context } from 'koa';
import nodeFetch, { RequestInit } from 'node-fetch';

import { errorResponse } from './response';

export const fetch = async (ctx: Context, url: string, init: RequestInit = { method: 'get' }) => {
  try {
    const response = await nodeFetch(url, init);
    const json = await response.json();

    if (json.statusCode >= 399) {
      console.error(json);
      return errorResponse(ctx, json.statusCode);
    }

    return json;
  } catch (err) {
    console.error(err);
    return errorResponse(ctx, err.status);
  }
};
