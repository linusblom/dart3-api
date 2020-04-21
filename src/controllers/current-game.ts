import { Context } from 'koa';
import { CreateGamePlayer, Game, GameType } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { GameRepository, GamePlayerRepository } from '../repositories';
import { response, errorResponse } from '../utils';

const startScore = {
  [GameType.Five01DoubleInDoubleOut]: 501,
  [GameType.Five01SingleInDoubleOut]: 501,
  [GameType.Three01SDoubleInDoubleOut]: 301,
  [GameType.Three01SingleInDoubleOut]: 301,
  [GameType.HalveIt]: 0,
  [GameType.Legs]: 3,
};

export class CurrentGameController {
  constructor(
    private repo = new GameRepository(),
    private gamePlayerRepo = new GamePlayerRepository(),
  ) {}

  async get(ctx: Context, currentGame: Game) {
    const players = await this.gamePlayerRepo.get(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.OK, { ...currentGame, players });
  }

  async createGamePlayer(ctx: Context, currentGame: Game, body: CreateGamePlayer) {
    if (currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.gamePlayerRepo.create(
      ctx,
      currentGame.id,
      startScore[currentGame.type],
      currentGame.bet,
      body.playerId,
    );

    const players = await this.gamePlayerRepo.get(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.CREATED, { players });
  }

  async deleteGamePlayer(ctx: Context, currentGame: Game, playerId: number) {
    if (currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.gamePlayerRepo.delete(ctx, currentGame.id, currentGame.bet, playerId);

    const players = await this.gamePlayerRepo.get(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.OK, { players });
  }

  async delete(ctx: Context, currentGame: Game) {
    if (currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.repo.delete(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.OK);
  }

  async start(ctx: Context, currentGame: Game) {
    if (currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.repo.start(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.OK);
  }
}
