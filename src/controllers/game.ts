import { Context } from 'koa';
import { CreateGame, Game } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { response, errorResponse } from '../utils';
import { db } from '../database';

export class GameController {
  async create(ctx: Context, userId: string, body: CreateGame) {
    return db.task(async t => {
      const currentGame = await t.game.findCurrent(userId);

      if (currentGame) {
        return errorResponse(ctx, httpStatusCodes.CONFLICT);
      }

      const game = await t.game.create(userId, body);

      return response(ctx, httpStatusCodes.CREATED, { ...game, pendingPlayers: [] });
    });
  }

  async getByUid(ctx: Context, userId: string, uid: string) {
    try {
      return db.task(async t => {
        const game = await t.game.findByUid(userId, uid);
        const winners = await t.team.findWinnersByGameId(game.id);

        return response(ctx, httpStatusCodes.OK, { ...game, winners });
      });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }
  }
}
