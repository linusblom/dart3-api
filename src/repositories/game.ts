import { Context } from 'koa';
import { DbId, GameType, Game, GamePlayer } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryAll } from '../database';
import { errorResponse } from '../utils';

export class GameRepository {
  async getById(ctx: Context, userId: string, gameId: number) {
    const game = await queryOne<Game>(
      `
      SELECT id, type, legs, sets, game_player_id, bet, created_at, started_at, ended_at
      FROM game
      WHERE id = $1 AND user_id = $2;
      `,
      [gameId, userId],
    );

    return game ? game : errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  async getCurrentGame(ctx: Context, userId: string) {
    const game = await queryOne<Game>(
      `
      SELECT id, type, legs, sets, game_player_id, bet, created_at, started_at, ended_at
      FROM game
      WHERE user_id = $1 AND ended_at IS NULL;
      `,
      [userId],
    );

    return game;
  }

  async create(
    ctx: Context,
    userId: string,
    type: GameType,
    legs: number,
    sets: number,
    bet: number,
  ) {
    const response = await queryOne<DbId>(
      `
      INSERT INTO game (user_id, type, legs, sets, bet)
      values($1, $2, $3, $4, $5)
      RETURNING id;
      `,
      [userId, type, legs, sets, bet],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async getGamePlayers(ctx: Context, gameId: number) {
    const gamePlayers = await queryAll<GamePlayer>(
      `
      SELECT id, player_id, turn, leg, set, score, position, xp, win
      FROM game_player
      WHERE game_id = $1;
      `,
      [gameId],
    );

    return gamePlayers;
  }

  async createGamePlayer(ctx: Context, gameId: number, playerId: number) {
    const response = await queryOne<DbId>(
      `
      INSERT INTO game_player (game_id, player_id)
      values($1, $2)
      RETURNING id;
      `,
      [gameId, playerId],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async update(
    ctx: Context,
    userId: string,
    gameId: number,
    type: GameType,
    legs: number,
    sets: number,
    bet: number,
  ) {
    const response = await queryOne<DbId>(
      `
      UPDATE game
      SET type = $1, legs = $2, sets = $3, bet = $4
      WHERE user_id = $5 AND id = $6 AND started_at IS NULL
      RETURNING id;
      `,
      [type, legs, sets, bet, userId, gameId],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async delete(ctx: Context, userId: string, gameId: number) {
    await queryOne<DbId>(
      `
      DELETE FROM game
      WHERE user_id = $1 AND id = $2 AND started_at IS NULL;
      `,
      [userId, gameId],
    );

    return;
  }
}
