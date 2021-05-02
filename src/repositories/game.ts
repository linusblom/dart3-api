import { IDatabase, IMain } from 'pg-promise';
import { CreateGame, DbId, Game, MetaData, StartGame } from 'dart3-sdk';
import { nanoid } from 'nanoid';

import { game as sql } from '../database/sql';

export class GameRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByUid(userId: string, uid: string) {
    return this.db.one<Game>(sql.findByUid, { userId, uid });
  }

  async findIdByUid(userId: string, uid: string) {
    return this.db.one<DbId>('SELECT id FROM game WHERE user_id = $1 AND uid = $2', [userId, uid]);
  }

  async findCurrent(userId: string) {
    return this.db.oneOrNone<Game>(sql.findCurrent, { userId });
  }

  async create(userId: string, game: CreateGame) {
    return this.db.one<Game>(sql.create, { userId, uid: nanoid(20), ...game });
  }

  async update(id: number, payload: StartGame) {
    await this.db.none(sql.update, { id, ...payload });
  }

  async delete(id: number) {
    await this.db.none(sql.delete, { id });
  }

  async start(id: number, payload: StartGame, meta: MetaData) {
    await this.db.none(sql.start, {
      id,
      fee: meta.jackpotFee + meta.nextJackpotFee + meta.rake,
      ...payload,
    });
  }

  async end(id: number) {
    await this.db.none(sql.end, { id });
  }
}
