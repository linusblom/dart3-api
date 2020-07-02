import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { response } from '../utils';
import { db } from '../database';

export class JackpotController {
  async get(ctx: Context, userId: string) {
    const jackpot = await db.jackpot.get(userId);

    return response(ctx, httpStatusCodes.OK, jackpot);
  }
}
