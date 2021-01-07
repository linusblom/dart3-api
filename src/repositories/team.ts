import { IDatabase, IMain } from 'pg-promise';
import { DbId, Team } from 'dart3-sdk';

import { team as sql } from '../database/sql';
import { MatchWinner } from '../models';

export class TeamRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<Team>(sql.findByGameId, { gameId });
  }

  async findById(id: number) {
    return this.db.oneOrNone<Team>(sql.findById, { id });
  }

  async findResultsByGameId(gameId: number) {
    return this.db.any(sql.findResultsByGameId, { gameId });
  }

  async create(teamPlayerIds: number[][], gameId: number) {
    const data = teamPlayerIds.map(() => ({ game_id: gameId }));
    const cs = new this.pgp.helpers.ColumnSet(['game_id'], { table: 'team' });

    return await this.db.any<DbId>(`${this.pgp.helpers.insert(data, cs)} RETURNING id`);
  }

  async updatePosition(results: MatchWinner[]) {
    const data = results.map(({ teamId, position }) => ({ id: teamId, position }));
    const cs = new this.pgp.helpers.ColumnSet(['?id', 'position'], { table: 'team' });

    await this.db.none(`${this.pgp.helpers.update(data, cs)} WHERE v.id = t.id`);
  }
}
