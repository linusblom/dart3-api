import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { ScoreTotal, Hit } from 'dart3-sdk';

import { queryAll, queryVoid } from '../database';
import { errorResponse } from '../utils';

export class HitRepository {
  async getByGameId(ctx: Context, gameId: number) {
    const [response, err] = await queryAll<Hit>(
      `
      SELECT id, team_id, player_id, dart, round, leg, set, value, multiplier, total, gem
      FROM hit
      WHERE team_id IN (SELECT id FROM team_player WHERE game_id = $1)
      ORDER BY set, leg, round, dart;
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getByTeamId(ctx: Context, gamePlayerId: number) {
    const [response, err] = await queryAll<Hit>(
      `
      SELECT id, team_id, player_id, dart, round, leg, set, value, multiplier, total, gem
      FROM hit
      WHERE team_id = $1
      ORDER BY set, leg, round, dart;
      `,
      [gamePlayerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  // async getGamePlayerCurrentRound(ctx: Context, gamePlayerId: number) {
  //   const [response, err] = await queryOne<{ round: number }>(
  //     `
  //     SELECT round
  //     FROM game_score
  //     WHERE game_player_id = $1
  //     GROUP BY round
  //     HAVING count(round) = 3
  //     ORDER BY round DESC
  //     LIMIT 1;
  //     `,
  //     [gamePlayerId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return response ? response.round + 1 : 1;
  // }

  async create(
    ctx: Context,
    teamId: number,
    playerId: number,
    dart: number,
    round: number,
    leg: number,
    set: number,
    score: ScoreTotal,
    gem: boolean,
  ) {
    const err = await queryVoid(
      `
      INSERT INTO game_score (team_id, player_id, dart, round, leg, set, value, multiplier, total, gem)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
      [teamId, playerId, dart, round, leg, set, score.value, score.multiplier, score.total, gem],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }

  // async getGemCount(ctx: Context, gamePlayerId: number): Promise<number> {
  //   const [response, err] = await queryOne(
  //     `
  //     SELECT COUNT(gs.gem) AS gems, j.id IS NOT NULL AS paid
  //     FROM game_score AS gs
  //     LEFT JOIN jackpot AS j ON gs.game_player_id = j.game_player_id
  //     WHERE gs.game_player_id = $1 AND gs.gem = true
  //     GROUP BY j.id;
  //     `,
  //     [gamePlayerId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   console.log(response);

  //   return response && !response.paid ? response.gems : 0;
  // }
}
