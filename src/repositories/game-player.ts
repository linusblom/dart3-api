import { Context } from 'koa';
import { GamePlayer } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryAll, transaction, queryOne } from '../database';
import { errorResponse } from '../utils';
import { SQLError } from '../enums';

export class GamePlayerRepository {
  async getByGameId(ctx: Context, gameId: number): Promise<GamePlayer[]> {
    const [response, err] = await queryAll(
      `
      SELECT id, player_id, turn, legs, sets, total, position, xp, win, gems
      FROM game_player
      WHERE game_id = $1
      ORDER BY turn;
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getById(ctx: Context, gamePlayerId: number): Promise<GamePlayer> {
    const [response, err] = await queryOne(
      `
      SELECT id, player_id, turn, legs, sets, total, position, xp, win, gems
      FROM game_player
      WHERE id = $1;
      `,
      [gamePlayerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async create(
    ctx: Context,
    gameId: number,
    total: number,
    bet: number,
    playerId: number,
  ): Promise<number> {
    const [response, err] = await transaction([
      {
        query: `INSERT INTO game_player (game_id, player_id, total) VALUES ($1, $2, $3) RETURNING id;`,
        params: [gameId, playerId, total],
      },
      {
        query: `
          INSERT INTO transaction (player_id, type, debit, balance, description)
          SELECT $1, 'bet', $2, balance - $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          RETURNING id;
        `,
        params: [playerId, bet, `Game ${gameId}`],
      },
    ]);

    if (err) {
      switch (err.code) {
        case SQLError.CheckViolation:
          return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE, {
            message: 'Insufficient Funds',
          });
        case SQLError.UniqueViolation:
          return errorResponse(ctx, httpStatusCodes.CONFLICT, {
            message: 'Player already in game',
          });
        default:
          return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
      }
    }

    return response;
  }

  async delete(ctx: Context, gameId: number, bet: number, playerId: number) {
    const [response, err] = await transaction([
      {
        query: `DELETE FROM game_player WHERE game_id = $1 AND player_id = $2 RETURNING id;`,
        params: [gameId, playerId],
      },
      {
        query: `
          INSERT INTO transaction (player_id, type, credit, balance, description)
          SELECT $1, 'refund', $2, balance + $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          RETURNING id;
        `,
        params: [playerId, bet, `Game ${gameId}`],
      },
    ]);

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }
}
