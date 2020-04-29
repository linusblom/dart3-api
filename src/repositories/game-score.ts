import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { GameScore, ScoreTotal } from 'dart3-sdk';

import { queryAll, queryOne } from '../database';
import { errorResponse } from '../utils';

export class GameScoreRepository {
  async getByGameId(ctx: Context, gameId: number): Promise<GameScore[]> {
    const [response, err] = await queryAll(
      `
      SELECT id, dart, round, leg, set, score, multiplier, valid
      FROM game_score
      WHERE game_player_id IN (SELECT id FROM game_player WHERE game_id = $1)
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getGamePlayerCurrentRound(ctx: Context, gamePlayerId: number) {
    const [response, err] = await queryOne(
      `
      SELECT round
      FROM game_score
      WHERE game_player_id = $1
      GROUP BY round
      HAVING count(round) = 3 
      ORDER BY round DESC
      LIMIT 1;
      `,
      [gamePlayerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response ? response.round + 1 : 1;
  }

  async createGameScore(
    ctx: Context,
    gamePlayerId: number,
    dart: number,
    round: number,
    leg: number,
    set: number,
    score: ScoreTotal,
  ) {
    const [response, err] = await queryAll(
      `
      INSERT INTO game_score (game_player_id, dart, round, leg, set, value, multiplier, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
      `,
      [gamePlayerId, dart, round, leg, set, score.value, score.multiplier, score.total],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }
}
