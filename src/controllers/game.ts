import { Context } from 'koa';
import { CreateGame, Game } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { response, errorResponse } from '../utils';
import { db } from '../database';

export class GameController {
  async create(ctx: Context, userId: string, body: CreateGame) {
    let game: Game;

    await db.task(async t => {
      const currentGame = await t.game.findCurrent(userId);

      if (currentGame) {
        return errorResponse(ctx, httpStatusCodes.CONFLICT);
      }

      game = await t.game.create(userId, body);
    });

    return response(ctx, httpStatusCodes.CREATED, { ...game, pendingPlayers: [] });
  }
}
