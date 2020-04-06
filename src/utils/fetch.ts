import { Context } from 'koa';
import nodeFetch, { RequestInit } from 'node-fetch';

import { errorResponse } from './response';

export interface Options {
  method: string;
  headers?: { [key: string]: string };
  body?: any;
}

export const fetch = async (ctx: Context, url: string, init: RequestInit = { method: 'get' }) => {
  try {
    const response = await nodeFetch(url, init);
    const json = await response.json();

    return json;
  } catch (err) {
    console.error(err);
    return errorResponse(ctx, err.status);
  }
};
