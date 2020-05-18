import { IDatabase, IMain } from 'pg-promise';
import { ScoreTotal, Hit } from 'dart3-sdk';

import { hit as sql } from '../database/sql';

export class HitRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async create(
    teamId: number,
    playerId: number,
    dart: number,
    round: number,
    leg: number,
    set: number,
    score: ScoreTotal,
    gem: boolean,
  ) {
    return this.db.none(sql.create, { teamId, playerId, dart, round, leg, set, ...score, gem });
  }
}
