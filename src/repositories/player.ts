import { IDatabase, IMain } from 'pg-promise';
import { Player, CreatePlayer, UpdatePlayer } from 'dart3-sdk';

import { player as sql } from '../database/sql';

export class PlayerRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async all(userId: string) {
    return this.db.any<Player>(sql.all, { userId });
  }

  async findById(userId: string, id: number) {
    return this.db.one<Player>(sql.findById, { userId, id });
  }

  async create(userId: string, player: CreatePlayer, color: string, avatar: string, pin: string) {
    return this.db.one<Player>(sql.create, { userId, ...player, color, avatar, pin });
  }

  async update(userId: string, id: number, player: UpdatePlayer) {
    return this.db.none(sql.update, { userId, id, ...player });
  }

  async updatePin(userId: string, id: number, pin: string) {
    return this.db.none(sql.updatePin, { userId, id, pin });
  }

  async delete(userId: string, id: number) {
    return this.db.none(sql.delete, { userId, id });
  }
}
