import { IDatabase, IMain } from 'pg-promise';
import { Player, CreatePlayer, UpdatePlayer, DbId } from 'dart3-sdk';
import { nanoid } from 'nanoid';

import { player as sql } from '../database/sql';

export class PlayerRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async all(userId: string) {
    return this.db.any<Player>(sql.all, { userId });
  }

  async findIdByUid(userId: string, uid: string) {
    return this.db.one<DbId>('SELECT id FROM player WHERE user_id = $1 AND uid = $2', [
      userId,
      uid,
    ]);
  }

  async findByUid(userId: string, uid: string) {
    return this.db.one<Player>(sql.findByUid, { userId, uid });
  }

  async findIdByPin(userId: string, uid: string, pin: string) {
    return this.db.oneOrNone<DbId>(sql.findIdByPin, { userId, uid, pin });
  }

  async findIdByAdmin(userId: string, pin: string) {
    return this.db.one<DbId>(sql.findIdByAdmin, { userId, pin });
  }

  async create(userId: string, player: CreatePlayer, color: string, avatar: string, pin: string) {
    return this.db.one<Player>(sql.create, {
      userId,
      uid: nanoid(20),
      ...player,
      color,
      avatar,
      pin,
    });
  }

  async update(userId: string, uid: string, player: UpdatePlayer) {
    await this.db.none(sql.update, { userId, uid, ...player });
  }

  async updatePin(userId: string, uid: string, pin: string) {
    await this.db.none(sql.updatePin, { userId, uid, pin });
  }

  async disablePin(userId: string, uid: string) {
    await this.db.none(sql.disablePin, { userId, uid });
  }

  async delete(userId: string, uid: string) {
    return this.db.one<DbId>(sql.delete, { userId, uid });
  }

  async findStatisticsById(playerId: number) {
    return this.db.one(sql.findStatisticsById, { playerId });
  }

  async updateXp(id: number, gameId: number) {
    await this.db.none(sql.updateXp, { id, gameId });
  }
}
