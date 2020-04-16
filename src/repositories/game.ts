import { Context } from 'koa';
import { GameType, Game } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryId } from '../database';
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

  async update(
    ctx: Context,
    userId: string,
    gameId: number,
    type: GameType,
    legs: number,
    sets: number,
    bet: number,
  ): Promise<number> {
    const [response, err] = await queryId(
      `
      UPDATE game
      SET type = $1, legs = $2, sets = $3, bet = $4
      WHERE user_id = $5 AND id = $6 AND started_at IS NULL
      RETURNING id;
      `,
      [type, legs, sets, bet, userId, gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async delete(ctx: Context, userId: string, gameId: number): Promise<number> {
    const [response, err] = await queryId(
      `
      DELETE FROM game
      WHERE user_id = $1 AND id = $2 AND started_at IS NULL
      RETURNING id;
      `,
      [userId, gameId],
    );

    if (err && err.code === SQLError.ForeignKeyViolation) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }
}
