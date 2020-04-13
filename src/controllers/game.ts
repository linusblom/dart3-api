import { Context } from 'koa';
import { CreateGame, TransactionType, CreateGamePlayer } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { GameRepository, TransactionRepository } from '../repositories';
import { response, errorResponse } from '../utils';

export class GameController {
  constructor(
    private repo = new GameRepository(),
    private transactionRepo = new TransactionRepository(),
  ) {}

  async getCurrentGame(ctx: Context, userId: string) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    return currentGame
      ? response(ctx, httpStatusCodes.OK, currentGame)
      : errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  async create(ctx: Context, userId: string, body: CreateGame) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (currentGame) {
      return errorResponse(ctx, httpStatusCodes.CONFLICT);
    }

    const gameId = await this.repo.create(ctx, userId, body.type, body.legs, body.sets, body.bet);

    const game = await this.repo.getById(ctx, userId, gameId);
    const players = await this.repo.getGamePlayers(ctx, gameId);

    return response(ctx, httpStatusCodes.CREATED, { ...game, players });
  }

  async createGamePlayer(ctx: Context, userId: string, gameId: number, body: CreateGamePlayer) {
    const currentGame = await this.repo.getCurrentGame(ctx, userId);

    if (!currentGame || currentGame.startedAt || gameId !== currentGame.id) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.transactionRepo.debit(
      ctx,
      body.playerId,
      TransactionType.Bet,
      currentGame.bet,
      `Game ${currentGame.id}`,
    );
    await this.repo.createGamePlayer(ctx, gameId, body.playerId);

    const players = await this.repo.getGamePlayers(ctx, gameId);

    return response(ctx, httpStatusCodes.CREATED, { players });
  }

  async delete(ctx: Context, userId: string, gameId: number) {
    await this.repo.delete(ctx, userId, gameId);

    return response(ctx, httpStatusCodes.OK);
  }
}
