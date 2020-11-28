import { IDatabase, IMain } from 'pg-promise';
import { CreateGame, Game } from 'dart3-sdk';
import { nanoid } from 'nanoid';

import { game as sql } from '../database/sql';

export class GameRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByUid(userId: string, uid: string) {
    return this.db.one<Game>(sql.findByUid, { userId, uid });
  }

  async findCurrent(userId: string) {
    return this.db.oneOrNone<Game>(sql.findCurrent, { userId });
  }

  async create(userId: string, game: CreateGame) {
    return this.db.one<Game>(sql.create, { userId, uid: nanoid(20), ...game });
  }

  async delete(id: number) {
    return this.db.none(sql.delete, { id });
  }
}
