import { Context } from 'koa';
import { CreateGame } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { GameRepository, GamePlayerRepository } from '../repositories';
import { response, errorResponse } from '../utils';

export class GameController {
  constructor(
    private gameRepo = new GameRepository(),
    private gamePlayerRepo = new GamePlayerRepository(),
  ) {}

  async create(ctx: Context, userId: string, body: CreateGame) {
    const currentGame = await this.gameRepo.getCurrentGame(ctx, userId);

    if (currentGame) {
      return errorResponse(ctx, httpStatusCodes.CONFLICT);
    }

    const game = await this.gameRepo.create(
      ctx,
      userId,
      body.type,
      body.legs,
      body.sets,
      body.bet,
      body.variant,
    );

    const players = await this.gamePlayerRepo.getById(ctx, game.id);

    return response(ctx, httpStatusCodes.CREATED, { ...game, players });
  }
}
