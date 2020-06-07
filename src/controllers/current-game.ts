import { Context } from 'koa';
import { CreateTeamPlayer, Score } from 'dart3-sdk';
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
    try {
      await db.game.delete(service.game.id);

      return response(ctx, httpStatusCodes.OK);
    } catch (err) {
      if (err.code === SQLErrorCode.ForeignKeyViolation) {
        return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
      }

      throw err;
    }
  }

  async createTeamPlayer(
    ctx: Context,
    service: GameService,
    userId: string,
    body: CreateTeamPlayer,
  ) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    try {
      const player = await db.player.findIdByUid(userId, body.uid);
      const players = await db.teamPlayer.create(service.game.id, player.id, service.game.bet);

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
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    try {
      const player = await db.player.findIdByUid(uid, userId);
      const players = await db.teamPlayer.delete(service.game.id, player.id, service.game.bet);

      return response(ctx, httpStatusCodes.CREATED, { players });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }
  }

  async start(ctx: Context, service: GameService) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const players = await db.teamPlayer.findByGameIdWithPro(service.game.id);

    await db.game.start(
      service.game.id,
      service.getTeamPlayerIds(ctx, players),
      service.game.tournament,
      service.getStartScore(),
    );

    return response(ctx, httpStatusCodes.OK);
  }

  async allMatches(ctx: Context, service: GameService) {
    const matches = await db.match.findByGameId(service.game.id);
    const teams = await db.matchTeam.findByGameId(service.game.id);
    const hits = await db.hit.findRoundHitsByTeamIds(teams.map(({ id }) => id));

    return response(ctx, httpStatusCodes.OK, { matches, teams, hits });
  }

  async createRound(ctx: Context, service: GameService, body: Score[]) {
    if (!service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const active = await db.match.findActiveByGameId(service.game.id);
    const roundScore = service.getRoundScore(body, active.round, active.currentScore);
    await db.hit.createRound(active, roundScore);
    await db.match.executeNextRoundTx(service.getNextRoundTx(active));

    const match = await db.match.findById(active.id);
    const team = await db.matchTeam.findById(active.matchTeamId);
    const hits = await db.hit.findRoundHitsByRounds(
      match.id,
      match.activeSet,
      match.activeLeg,
      match.activeRound,
    );

    return response(ctx, httpStatusCodes.OK, { match, team, hits });
  }
}
