import { Context } from 'koa';
import { CreateGamePlayer, Game, Score } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { GameRepository, GamePlayerRepository, GameScoreRepository } from '../repositories';
import { response, errorResponse } from '../utils';
import { GameUtils } from '../game-utils';

export class CurrentGameController {
  constructor(
    private repo = new GameRepository(),
    private gamePlayerRepo = new GamePlayerRepository(),
    private gameScoreRepo = new GameScoreRepository(),
  ) {}

  async get(ctx: Context, utils: GameUtils) {
    const players = await this.gamePlayerRepo.getByGameId(ctx, utils.game.id);
    const scores = await this.gameScoreRepo.getByGameId(ctx, utils.game.id);

    return response(ctx, httpStatusCodes.OK, {
      ...utils.game,
      players: players.map(player => ({
        ...player,
        scores: scores.filter(score => score.gamePlayerId === player.id),
      })),
    });
  }

  async createGamePlayer(ctx: Context, utils: GameUtils, body: CreateGamePlayer) {
    if (utils.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const total = utils.getStartTotal();

    await this.gamePlayerRepo.create(ctx, utils.game.id, total, utils.game.bet, body.playerId);

    const players = await this.gamePlayerRepo.getByGameId(ctx, utils.game.id);

    return response(ctx, httpStatusCodes.CREATED, { players });
  }

  async deleteGamePlayer(ctx: Context, utils: GameUtils, playerId: number) {
    if (utils.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.gamePlayerRepo.delete(ctx, utils.game.id, utils.game.bet, playerId);

    const players = await this.gamePlayerRepo.getByGameId(ctx, utils.game.id);

    return response(ctx, httpStatusCodes.OK, { players });
  }

  async delete(ctx: Context, utils: GameUtils) {
    if (utils.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.repo.delete(ctx, utils.game.id);

    return response(ctx, httpStatusCodes.OK);
  }

  async start(ctx: Context, utils: GameUtils) {
    if (utils.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.repo.start(ctx, utils.game.id);

    return response(ctx, httpStatusCodes.OK);
  }

  async createRound(ctx: Context, utils: GameUtils, body: { scores: Score[] }) {
    if (!utils.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const { gamePlayerId, currentLeg, currentSet, type } = utils.game;
    const round = await this.gameScoreRepo.getGamePlayerCurrentRound(ctx, gamePlayerId);
    const player = await this.gamePlayerRepo.getById(ctx, gamePlayerId);
    const scores = utils.getScoreTotal(body.scores, round, player.total);

    await Promise.all(
      scores.map(async (score, index) =>
        this.gameScoreRepo.createGameScore(
          ctx,
          utils.game.gamePlayerId,
          index + 1,
          round,
          currentLeg,
          currentSet,
          score,
        ),
      ),
    );

    return response(ctx, httpStatusCodes.OK);
  }
}
