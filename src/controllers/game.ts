import { Context } from 'koa';
import { CreateGame, CreateGamePlayer } from 'dart3-sdk';
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

  async getCurrentGame(ctx: Context, userId: string) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (!currentGame) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }

    const players = await this.gamePlayerRepo.get(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.OK, { ...currentGame, players });
  }

  async createCurrentGamePlayer(ctx: Context, userId: string, body: CreateGamePlayer) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (!currentGame || currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.gamePlayerRepo.create(ctx, currentGame.id, currentGame.bet, body.playerId);

    const players = await this.gamePlayerRepo.get(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.CREATED, { players });
  }

  async deleteCurrentGamePlayer(ctx: Context, userId: string, playerId: number) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (!currentGame || currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.gamePlayerRepo.delete(ctx, currentGame.id, currentGame.bet, playerId);

    const players = await this.gamePlayerRepo.get(ctx, currentGame.id);

    return response(ctx, httpStatusCodes.OK, { players });
  }

  async deleteCurrentGame(ctx: Context, userId: string) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (!currentGame || currentGame.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.repo.delete(ctx, userId, currentGame.id);

    return response(ctx, httpStatusCodes.OK);
  }
}
