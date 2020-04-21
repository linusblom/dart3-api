import { Context } from 'koa';
import { GameType, Game } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryId, queryAll } from '../database';
import { errorResponse } from '../utils';
import { SQLError } from '../enums';

export class GameRepository {
  async getById(ctx: Context, userId: string, gameId: number): Promise<Game> {
    const [response, err] = await queryOne(
      `
      SELECT id, type, legs, sets, game_player_id, bet, created_at, started_at, ended_at
      FROM game
      WHERE id = $1 AND user_id = $2;
      `,
      [gameId, userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    if (!response) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }

    return response;
  }

  async getCurrentGame(ctx: Context, userId: string): Promise<Game> {
    const [response, err] = await queryOne(
      `
      SELECT id, type, legs, sets, game_player_id, bet, created_at, started_at, ended_at
      FROM game
      WHERE user_id = $1 AND ended_at IS NULL;
      `,
      [userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async create(
    ctx: Context,
    userId: string,
    type: GameType,
    legs: number,
    sets: number,
    bet: number,
  ): Promise<number> {
    const [response, err] = await queryId(
      `
      INSERT INTO game (user_id, type, legs, sets, bet)
      values($1, $2, $3, $4, $5)
      RETURNING id;
      `,
      [userId, type, legs, sets, bet],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async delete(ctx: Context, gameId: number): Promise<number> {
    const [response, err] = await queryId(
      `
      DELETE FROM game
      WHERE id = $1 AND started_at IS NULL
      RETURNING id;
      `,
      [gameId],
    );

    if (err && err.code === SQLError.ForeignKeyViolation) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async start(ctx: Context, gameId: number): Promise<number> {
    const [players, _] = await queryAll(
      `
      SELECT id
      FROM game_player
      WHERE game_id = $1;
      `,
      [gameId],
    );

    const playerIds = players.map(({ id }) => id).sort(() => Math.random() - 0.5);

    await Promise.all(
      playerIds.map(
        async (id: number, index: number) =>
          await queryOne('UPDATE game_player SET turn = $1 WHERE id = $2;', [index + 1, id]),
      ),
    );

    const [response, err] = await queryId(
      `
      UPDATE game
      SET started_at = CURRENT_TIMESTAMP, game_player_id = $1
      WHERE id = $2
      RETURNING id;
      `,
      [playerIds[0], gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }
}
