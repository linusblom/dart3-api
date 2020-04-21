import { Context } from 'koa';
import { CreateGame } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { GameRepository, GamePlayerRepository } from '../repositories';
import { response, errorResponse } from '../utils';

export class GameController {
  constructor(
    private repo = new GameRepository(),
    private gamePlayerRepo = new GamePlayerRepository(),
  ) {}

  async create(ctx: Context, userId: string, body: CreateGame) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (currentGame) {
      return errorResponse(ctx, httpStatusCodes.CONFLICT);
    }

    const gameId = await this.repo.create(ctx, userId, body.type, body.legs, body.sets, body.bet);

    const game = await this.repo.getById(ctx, userId, gameId);
    const players = await this.gamePlayerRepo.get(ctx, gameId);

    return response(ctx, httpStatusCodes.CREATED, { ...game, players });
  }
}
