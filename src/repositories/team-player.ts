import { IDatabase, IMain } from 'pg-promise';
import { TeamPlayer, TransactionType } from 'dart3-sdk';

import { teamPlayer as sql, transaction as transactionSql } from '../database/sql';

export class TeamPlayerRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<TeamPlayer>(sql.findByGameId, { gameId });
  }

  async create(gameId: number, playerId: number, bet: number) {
    return await this.db.tx(async tx => {
      await tx.none(sql.create, { gameId, playerId });

      await tx.one(transactionSql.debit, {
        playerId,
        description: `Game ${gameId}`,
        type: TransactionType.Bet,
        amount: bet,
      });

      const players: TeamPlayer[] = await tx.any(sql.findByGameId, { gameId });
      return players;
    });
  }

  async delete(gameId: number, playerId: number, bet: number) {
    return await this.db.tx(async tx => {
      await tx.one(sql.delete, { gameId, playerId });

      await tx.one(transactionSql.credit, {
        playerId,
        description: `Game ${gameId}`,
        type: TransactionType.Refund,
        amount: bet,
      });

      const players: TeamPlayer[] = await tx.any(sql.findByGameId, { gameId });
      return players;
    });
  }

  // async getByGameIdWithSeed(ctx: Context, gameId: number) {
  //   const [response, err] = await queryAll<TeamPlayer & { seed: number }>(
  //     `
  //     SELECT tp.id, tp.team_id, tp.player_id, tp.game_id, tp.turn, tp.xp, tp.win, tp.gems, p.seed
  //     FROM team_player tp
  //     LEFT JOIN player p ON tp.player_id = p.id
  //     WHERE game_id = $1
  //     `,
  //     [gameId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return response;
  // }

  // async addTeamId(ctx: Context, teamPlayerIds: number[][], teamIds: number[]) {
  //   const errors = await Promise.all(
  //     teamPlayerIds.map(async (ids, index) => {
  //       console.log([teamIds[index], ...ids]);
  //       return await queryVoid(
  //         `
  //           UPDATE team_player
  //           SET team_id = t.team_id, turn = t.turn
  //           FROM (VALUES ${ids
  //             .map((_, n) => `($1, ${n + 1}, $${n + 2})`)
  //             .join(',')}) AS t(team_id, turn, team_player_id)
  //           WHERE id = t.team_player_id;
  //           `,
  //         [teamIds[index], ...ids],
  //       );
  //     }),
  //   );

  //   if (errors.some(err => err)) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, errors);
  //   }

  //   return;
  // }
}
