import { IDatabase, IMain } from 'pg-promise';
import { MatchTeam } from 'dart3-sdk';

import { matchTeam as sql } from '../database/sql';

export class MatchTeamRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(id: number) {
    return this.db.one<MatchTeam>(sql.findById, { id });
  }

  async findByGameId(gameId: number) {
    return this.db.any<MatchTeam>(sql.findByGameIdWithScore, { gameId });
  }
}
