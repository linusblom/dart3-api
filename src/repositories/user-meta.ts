import { MetaData } from 'dart3-sdk';
import { IDatabase, IMain } from 'pg-promise';

import { userMeta as sql } from '../database/sql';

export class UserMetaRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(id: string) {
    return this.db.one<MetaData>(sql.findById, { id });
  }

  async update(id: string, currency: string) {
    return this.db.none(sql.update, { id, currency });
  }
}
