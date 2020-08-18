import { IDatabase, IMain } from 'pg-promise';
import { TeamPlayer, TransactionType, GameType, gameName } from 'dart3-sdk';

import * as sql from '../database/sql';

export class TeamPlayerRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<TeamPlayer>(sql.teamPlayer.findByGameId, { gameId });
  }

  async create(gameId: number, playerId: number, bet: number, type: GameType) {
    return this.db.tx(async tx => {
      await tx.none(sql.teamPlayer.create, { gameId, playerId });

      await tx.one(sql.transaction.debit, {
        playerId,
        description: `${gameName(type)} (#${gameId})`,
        type: TransactionType.Bet,
        amount: bet,
      });

      const players: TeamPlayer[] = await tx.any(sql.teamPlayer.findByGameId, { gameId });
      return players;
    });
  }

  async delete(gameId: number, playerId: number, bet: number, type: GameType) {
    return this.db.tx(async tx => {
      await tx.one(sql.teamPlayer.delete, { gameId, playerId });

      await tx.one(sql.transaction.credit, {
        playerId,
        description: `${gameName(type)} (#${gameId})`,
        type: TransactionType.Refund,
        amount: bet,
      });

      const players: TeamPlayer[] = await tx.any(sql.teamPlayer.findByGameId, { gameId });
      return players;
    });
  }
}
