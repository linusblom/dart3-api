import { Context } from 'koa';
import { CreateTeamPlayer } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import {
  GameRepository,
  HitRepository,
  TeamRepository,
  TeamPlayerRepository,
} from '../repositories';
import { response, errorResponse } from '../utils';
import { GameService } from '../services';

export class CurrentGameController {
  constructor(
    private gameRepo = new GameRepository(),
    private teamRepo = new TeamRepository(),
    private hitRepo = new HitRepository(),
    private teamPlayerRepo = new TeamPlayerRepository(),
  ) {}

  async get(ctx: Context, service: GameService) {
    const teams = await this.teamRepo.getByGameId(ctx, service.game.id);
    const hits = await this.hitRepo.getByGameId(ctx, service.game.id);
    const players = await this.teamPlayerRepo.getByGameId(ctx, service.game.id);

    return response(ctx, httpStatusCodes.OK, {
      ...service.game,
      teams: teams.map(team => ({
        ...team,
        hits: hits.filter(({ teamId }) => teamId === team.id),
        players: players.filter(({ teamId }) => teamId === team.id),
      })),
      pendingPlayers: !service.game.startedAt ? players : [],
    });
  }

  async createTeamPlayer(ctx: Context, service: GameService, body: CreateTeamPlayer) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const total = service.getStartTotal();

    await this.teamPlayerRepo.create(ctx, service.game.id, body.playerId, service.game.bet);

    const players = await this.teamPlayerRepo.getByGameId(ctx, service.game.id);

    return response(ctx, httpStatusCodes.CREATED, { players });
  }

  async deleteTeamPlayer(ctx: Context, service: GameService, playerId: number) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.teamPlayerRepo.delete(ctx, service.game.id, playerId, service.game.bet);

    const players = await this.teamPlayerRepo.getByGameId(ctx, service.game.id);

    return response(ctx, httpStatusCodes.OK, { players });
  }

  async delete(ctx: Context, service: GameService) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await this.gameRepo.delete(ctx, service.game.id);

    return response(ctx, httpStatusCodes.OK);
  }

  async start(ctx: Context, service: GameService) {
    if (service.game.startedAt) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    const players = await this.teamPlayerRepo.getByGameIdWithSeed(ctx, service.game.id);
    const teamPlayerIds = service.getTeamPlayerIds(ctx, players);
    const teamIds = await this.teamRepo.createFromTeamPlayerIds(
      ctx,
      service.game.id,
      teamPlayerIds,
    );
    await this.teamPlayerRepo.addTeamId(ctx, teamPlayerIds, teamIds);
    // await this.gameRepo.start(ctx, service.game.id, teamIds[0]);

    // await this.gameRepo.start(ctx, service.game.id, service.game.variant);

    return response(ctx, httpStatusCodes.OK);
  }

  // async submitRound(ctx: Context, service: GameService, body: { scores: Score[] }) {
  //   if (!service.game.startedAt) {
  //     return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  //   }

  //   const round = await this.gameScoreRepo.getGamePlayerCurrentRound(ctx, service.game.gamePlayerId);
  //   const player = await this.gamePlayerRepo.getById(ctx, service.game.gamePlayerId);
  //   const { scores, total, xp } = service.getRoundScore(body.scores, round, player.total);

  //   await Promise.all(
  //     scores.map(async (score, index) =>
  //       this.gameScoreRepo.createGameScore(
  //         ctx,
  //         service.game.gamePlayerId,
  //         index + 1,
  //         round,
  //         service.game.currentLeg,
  //         service.game.currentSet,
  //         score,
  //         gemRandomizer(round),
  //       ),
  //     ),
  //   );

  //   await this.gamePlayerRepo.updateTotal(ctx, service.game.gamePlayerId, total, xp);
  //   const gameScores = await this.gameScoreRepo.getByGamePlayerId(ctx, service.game.gamePlayerId);
  //   const { gamePlayerId, lastTurn } = await this.gameRepo.nextPlayer(ctx, service.game.id);

  //   if (lastTurn && service.runLastTurn(round, total)) {
  //     const players = this.gamePlayerRepo.getByGameId(ctx, service.game.id);
  //   }

  //   return response(ctx, httpStatusCodes.OK, {
  //     gamePlayerId,
  //     player: { ...player, total, xp: player.xp + xp, scores: gameScores },
  //   });
  // }
}
