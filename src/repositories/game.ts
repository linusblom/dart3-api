import { IDatabase, IMain } from 'pg-promise';
import { CreateGame, Game, DbId, MatchStatus } from 'dart3-sdk';
import { nanoid } from 'nanoid';

import { game as sql } from '../database/sql';

export class GameRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(userId: string, id: number) {
    return this.db.oneOrNone<Game>(sql.findById, { userId, id });
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
