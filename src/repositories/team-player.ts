import { IDatabase, IMain } from 'pg-promise';
import { DbId, TeamPlayer, TransactionType } from 'dart3-sdk';

import * as sql from '../database/sql';
import { MatchActive, TeamPlayerPro } from '../models';

export class TeamPlayerRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<TeamPlayer>(sql.teamPlayer.findByGameId, { gameId });
  }

  async findByGameIdWithPro(gameId: number) {
    return this.db.any<TeamPlayerPro>(sql.teamPlayer.findByGameIdWithPro, {
      gameId,
    });
  }

  async create(gameId: number, playerId: number, bet: number) {
    return this.db.tx(async (tx) => {
      await tx.none(sql.teamPlayer.create, { gameId, playerId });

      await tx.one(sql.transaction.debit, {
        playerId,
        description: `Game #${gameId}`,
        type: TransactionType.Bet,
        amount: bet,
      });
    });
  }

  async delete(gameId: number, playerId: number, bet: number) {
    return this.db.tx(async (tx) => {
      await tx.one(sql.teamPlayer.delete, { gameId, playerId });

      await tx.one(sql.transaction.credit, {
        playerId,
        description: `Game #${gameId}`,
        type: TransactionType.Refund,
        amount: bet,
      });
    });
  }

  async updateTeamIds(ids: number[][], teamIds: DbId[]) {
    const data = ids.reduce(
      (acc, array, index) => [
        ...acc,
        ...array.map((id) => ({ id, team_id: teamIds[index].id, xp: 100 })),
      ],
      [],
    );
    const cs = new this.pgp.helpers.ColumnSet(['?id', 'team_id', 'xp'], { table: 'team_player' });

    await this.db.none(`${this.pgp.helpers.update(data, cs)} WHERE v.id = t.id`);
  }

  async updateXp({ teamId, playerId }: MatchActive, xp: number) {
    await this.db.none(sql.teamPlayer.updateXp, { teamId, playerId, xp });
  }

  async updateWin(gameId: number, playerId: number, win: number) {
    await this.db.none(sql.teamPlayer.updateWin, { gameId, playerId, win, xp: 1000 });
  }
}
