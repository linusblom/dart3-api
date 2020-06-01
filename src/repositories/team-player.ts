import { IDatabase, IMain } from 'pg-promise';
import { TeamPlayer, TransactionType } from 'dart3-sdk';

import { teamPlayer as sql, transaction as transactionSql } from '../database/sql';

export class TeamPlayerRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<TeamPlayer>(sql.findByGameId, { gameId });
  }

  async create(gameId: number, playerId: number, bet: number) {
    return this.db.tx(async tx => {
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
    return this.db.tx(async tx => {
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

  async findByGameIdWithPro(gameId: number) {
    return this.db.any<TeamPlayer & { pro: boolean }>(sql.findByGameIdWithPro, { gameId });
  }
}
