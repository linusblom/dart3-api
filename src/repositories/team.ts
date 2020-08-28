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

  async findWinnersByGameId(gameId: number) {
    return this.db.any(sql.findWinnersByGameId, { gameId });
  }
}
