import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { TeamPlayer } from 'dart3-sdk';

import { transaction, queryAll, queryVoid } from '../database';
import { SQLErrorCode } from '../models';
import { errorResponse } from '../utils';

export class TeamPlayerRepository {
  async getByGameId(ctx: Context, gameId: number, seed = false) {
    const [response, err] = await queryAll<TeamPlayer>(
      `
      SELECT id, team_id, player_id, game_id, turn, xp, win, gems
      FROM team_player
      WHERE game_id = $1
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getByGameIdWithSeed(ctx: Context, gameId: number) {
    const [response, err] = await queryAll<TeamPlayer & { seed: number }>(
      `
      SELECT tp.id, tp.team_id, tp.player_id, tp.game_id, tp.turn, tp.xp, tp.win, tp.gems, p.seed
      FROM team_player tp
      LEFT JOIN player p ON tp.player_id = p.id
      WHERE game_id = $1
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async create(ctx: Context, gameId: number, playerId: number, bet: number) {
    const [_, err] = await transaction([
      {
        query: `INSERT INTO team_player (game_id, player_id) VALUES ($1, $2);`,
        params: [gameId, playerId],
      },
      {
        query: `
          INSERT INTO transaction (player_id, type, debit, balance, description)
          SELECT $1, 'bet', $2, balance - $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1;
        `,
        params: [playerId, bet, `Game ${gameId}`],
      },
    ]);

    if (err) {
      switch (err.code) {
        case SQLErrorCode.CheckViolation:
          return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE, {
            message: 'Insufficient Funds',
          });
        case SQLErrorCode.UniqueViolation:
          return errorResponse(ctx, httpStatusCodes.CONFLICT, {
            message: 'Player already in game',
          });
        default:
          return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
      }
    }

    return;
  }

  async delete(ctx: Context, gameId: number, playerId: number, bet: number) {
    const [_, err] = await transaction([
      {
        query: `DELETE FROM team_player WHERE game_id = $1 AND player_id = $2;`,
        params: [gameId, playerId],
      },
      {
        query: `
          INSERT INTO transaction (player_id, type, credit, balance, description)
          SELECT $1, 'refund', $2, balance + $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1;
        `,
        params: [playerId, bet, `Game ${gameId}`],
      },
    ]);

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }

  async addTeamId(ctx: Context, teamPlayerIds: number[][], teamIds: number[]) {
    const errors = await Promise.all(
      teamPlayerIds.map(async (ids, index) => {
        console.log([teamIds[index], ...ids]);
        return await queryVoid(
          `
            UPDATE team_player
            SET team_id = t.team_id, turn = t.turn
            FROM (VALUES ${ids
              .map((_, n) => `($1, ${n + 1}, $${n + 2})`)
              .join(',')}) AS t(team_id, turn, team_player_id) 
            WHERE id = t.team_player_id;
            `,
          [teamIds[index], ...ids],
        );
      }),
    );

    if (errors.some(err => err)) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, errors);
    }

    return;
  }
}
