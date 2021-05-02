import { Context } from 'koa';
import { CreateTeamPlayer, Score, StartGame } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { response, errorResponse } from '../utils';
import { GameService } from '../services';
import { db } from '../database';
import { SQLErrorCode } from '../models';

export class CurrentGameController {
  async get(ctx: Context, service: GameService) {
    if (service.game.startedAt) {
      return response(ctx, httpStatusCodes.OK, service.game);
    }

    const pendingPlayers = await db.teamPlayer.findByGameId(service.game.id);

    return response(ctx, httpStatusCodes.OK, {
      ...service.game,
      pendingPlayers,
    });
  }

  async delete(ctx: Context, service: GameService) {
    const { id, bet } = service.game;

    await db.task(async (t) => {
      const players = await t.teamPlayer.findByGameId(id);

      await Promise.all(
        players.map(({ playerId }) => {
          ctx.logger.info({ playerId, gameId: id, bet }, 'Player left game (by cancellation)');
          return t.teamPlayer.delete(id, playerId, bet);
        }),
      );

      await db.game.delete(id);
    });

    ctx.logger.info({ ...service.game }, 'Game canceled');

    return response(ctx, httpStatusCodes.OK);
  }

  async createTeamPlayer(
    ctx: Context,
    service: GameService,
    userId: string,
    payload: CreateTeamPlayer,
  ) {
    try {
      const players = await db.task(async (t) => {
        const player = await t.player.findIdByUid(userId, payload.uid);
        const { id, bet } = service.game;

        await t.teamPlayer.create(id, player.id, bet);
        ctx.logger.info({ playerId: player.id, gameId: id, bet }, 'Player joined game');

        return await t.teamPlayer.findByGameId(id);
      });

      return response(ctx, httpStatusCodes.CREATED, { players });
    } catch (err) {
      switch (err.code) {
        case SQLErrorCode.UniqueViolation:
          return errorResponse(ctx, httpStatusCodes.CONFLICT);
        case SQLErrorCode.CheckViolation:
          return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE);
        default:
          throw err;
      }
    }
  }

  async deleteTeamPlayer(ctx: Context, service: GameService, uid: string, userId: string) {
    const players = await db.task(async (t) => {
      const player = await t.player.findIdByUid(userId, uid);
      const { id, bet } = service.game;

      await t.teamPlayer.delete(id, player.id, bet);
      ctx.logger.info({ playerId: player.id, gameId: id, bet }, 'Player left game');

      return await t.teamPlayer.findByGameId(id);
    });

    return response(ctx, httpStatusCodes.OK, { players });
  }

  async start(ctx: Context, service: GameService, payload: StartGame) {
    try {
      await service.start(payload);

      return response(ctx, httpStatusCodes.OK);
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST, err);
    }
  }

  async getMatches(ctx: Context, service: GameService) {
    return await db.task(async (t) => {
      const { id } = service.game;
      const matches = await t.match.findByGameId(id);
      const teams = await t.matchTeam.findByGameId(id);
      const hits = await t.hit.findRoundHitsByPlayingMatchAndGameId(id);

      return response(ctx, httpStatusCodes.OK, { matches, teams, hits });
    });
  }

  async createRound(ctx: Context, service: GameService, userId: string, scores: Score[]) {
    const { gems, ...round } = await service.createRound(scores);
    const jackpotWinner = round.teams.find((t) => t.gems >= 3 && !t.jackpotPaid);
    let playerIds = [];

    if (jackpotWinner) {
      const winner = await db.jackpot.winner(userId, service.game.id, jackpotWinner.id);
      playerIds = winner.team.playerIds;

      ctx.logger.info({ ...winner, gameId: service.game.id }, 'Jackpot winners');
    }

    return response(ctx, httpStatusCodes.OK, {
      ...round,
      jackpot: { gems, playerIds },
    });
  }
}
