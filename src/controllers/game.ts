import { Context } from 'koa';
import { CreateGame } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { response, errorResponse } from '../utils';
import { db } from '../database';

export class GameController {
  async create(ctx: Context, userId: string, body: CreateGame) {
    const currentGame = await db.game.findCurrent(userId);

    if (currentGame) {
      return errorResponse(ctx, httpStatusCodes.CONFLICT);
    }

    const game = await db.game.create(userId, body);

    return response(ctx, httpStatusCodes.CREATED, { ...game, pendingPlayers: [] });
  }
}
