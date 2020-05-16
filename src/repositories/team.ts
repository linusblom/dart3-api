import { IDatabase, IMain } from 'pg-promise';
import { Team } from 'dart3-sdk';

import { team as sql } from '../database/sql';

export class TeamRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<Team>(sql.findByGameId, { gameId });
  }

  async findById(id: number) {
    return this.db.oneOrNone<Team>(sql.findById, { id });
  }

  // async createFromTeamPlayerIds(ctx: Context, gameId: number, teamPlayerIds: number[][]) {
  //   const [response, err] = await queryAll<{ id: number }>(
  //     `
  //     INSERT INTO team (game_id)
  //     VALUES ${teamPlayerIds.map(() => '($1)').join(',')}
  //     RETURNING id;
  //     `,
  //     [gameId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return response.map(({ id }) => id);
  // }

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
