import { Context } from 'koa';
import { CreateGame } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { GameRepository } from '../repositories';
import { response, errorResponse } from '../utils';

export class GameController {
  constructor(private repo = new GameRepository()) {}

  async create(ctx: Context, userId: string, body: CreateGame) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (currentGame) {
      return errorResponse(ctx, httpStatusCodes.CONFLICT);
    }

    const game = await this.repo.create(ctx, userId, body);

    return response(ctx, httpStatusCodes.CREATED, { ...game, teams: [], pendingPlayers: [] });
  }
}
