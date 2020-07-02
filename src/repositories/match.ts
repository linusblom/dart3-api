import { IDatabase, IMain } from 'pg-promise';
import { Match, MatchActive } from 'dart3-sdk';

import { match as sql } from '../database/sql';

export class MatchRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(id: number) {
    return this.db.one<Match>(sql.findById, { id });
  }

  async findByGameId(gameId: number) {
    return this.db.any<Match>(sql.findByGameId, { gameId });
  }
}
