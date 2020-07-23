import { Context } from 'koa';
import { CreateTeamPlayer, Score, TeamPlayer, Match, MatchTeam, RoundHit } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { response, errorResponse, playerRandomizer } from '../utils';
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

    let players: TeamPlayer[];

    try {
      await db.task(async t => {
        const player = await t.player.findIdByUid(userId, body.uid);
        const { id, bet, type } = service.game;

        players = await t.teamPlayer.create(id, player.id, bet, type);
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
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    let players: TeamPlayer[];

    try {
      await db.task(async t => {
        const player = await t.player.findIdByUid(userId, uid);
        const { id, bet, type } = service.game;

        players = await t.teamPlayer.delete(id, player.id, bet, type);
      });

      return response(ctx, httpStatusCodes.CREATED, { players });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }
  }

  async start(ctx: Context, service: GameService) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await db.task(async t => {
      const { id, team, tournament } = service.game;
      const players = await t.teamPlayer.findByGameIdWithPro(id);

      if ((team || tournament) && (players.length % 2 !== 0 || players.length < 4)) {
        return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
      }

      await t.game.start(id, tournament, service.getStartScore(), playerRandomizer(players, team));
    });

    return response(ctx, httpStatusCodes.OK);
  }

  async getMatches(ctx: Context, service: GameService) {
    let matches: Match[], teams: MatchTeam[], hits: RoundHit[];

    await db.task(async t => {
      matches = await t.match.findByGameId(service.game.id);
      teams = await t.matchTeam.findByGameId(service.game.id);
      hits = await t.hit.findRoundHitsByTeamIds(teams.map(({ id }) => id));
    });

    return response(ctx, httpStatusCodes.OK, { matches, teams, hits });
  }

  async createRound(ctx: Context, service: GameService, userId: string, body: Score[]) {
    if (!service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const { gems, ...round } = await service.createRound(body);
    const jackpotWinner = round.teams.find(t => t.gems >= 3 && !t.jackpotPaid);
    let playerIds = [];

    if (jackpotWinner) {
      playerIds = await db.jackpot.winner(userId, service.game.id, jackpotWinner.id);
    }

    return response(ctx, httpStatusCodes.OK, {
      ...round,
      ...(gems && {
        jackpot: { gems, playerIds },
      }),
    });
  }
}
