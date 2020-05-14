import { Context } from 'koa';
import { Team } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryAll, queryOne } from '../database';
import { errorResponse } from '../utils';

export class TeamRepository {
  async getByGameId(ctx: Context, gameId: number) {
    const [response, err] = await queryAll<Team>(
      `
      SELECT id, game_id, legs, sets, total, position
      FROM team
      WHERE game_id = $1;
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getById(ctx: Context, teamId: number) {
    const [response, err] = await queryOne<Team>(
      `
      SELECT id, game_id, legs, sets, total, position
      FROM team
      WHERE id = $1;
      `,
      [teamId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async createFromTeamPlayerIds(ctx: Context, gameId: number, teamPlayerIds: number[][]) {
    const [response, err] = await queryAll<{ id: number }>(
      `
      INSERT INTO team (game_id)
      VALUES ${teamPlayerIds.map(() => '($1)').join(',')}
      RETURNING id;
      `,
      [gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response.map(({ id }) => id);
  }

  // async updateTotal(ctx: Context, gamePlayerId: number, total: number, xp: number) {
  //   const err = await queryVoid(
  //     `
  //     UPDATE game_player
  //     SET total = $1, xp = xp + $2
  //     WHERE id = $3;
  //     `,
  //     [total, xp, gamePlayerId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return;
  // }
}
