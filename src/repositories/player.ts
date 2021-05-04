import { IDatabase, IMain } from 'pg-promise';
import { Player, CreatePlayer, UpdatePlayer, DbId, PlayerStats, Role } from 'dart3-sdk';
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

  async findByPin(userId: string, uid: string, pin: string) {
    return this.db.oneOrNone<Partial<Player>>(sql.findByPin, { userId, uid, pin });
  }

  async findByAdminPin(userId: string, pin: string) {
    return this.db.one<Partial<Player>>(sql.findByAdminPin, { userId, pin });
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

  async update(userId: string, uid: string, { roles, ...player }: UpdatePlayer) {
    await this.db.none(sql.update, { userId, uid, ...player });
  }

  async updatePin(userId: string, uid: string, pin: string) {
    await this.db.none(sql.updatePin, { userId, uid, pin });
  }

  async toggleRoles(userId: string, uid: string, add: Role[], remove: Role[]) {
    const player = await this.findByUid(userId, uid);
    const roles = [...player.roles.filter((role) => ![...add, ...remove].includes(role)), ...add];

    await this.db.none(sql.updateRoles, { userId, uid, roles });

    return roles;
  }

  async delete(userId: string, uid: string) {
    return this.db.one<DbId>(sql.delete, { userId, uid });
  }

  async findStatisticsByUid(userId: string, uid: string) {
    return this.db.one<PlayerStats>(sql.findStatisticsByUid, { userId, uid });
  }

  async updateXp(id: number, gameId: number) {
    await this.db.none(sql.updateXp, { id, gameId });
  }

  async createEmailVerification(uid: string, token: string) {
    return this.db.none(sql.createEmailVerification, { uid, token });
  }

  async findEmailVerification(uid: string, token: string) {
    return this.db.one(sql.findEmailVerification, { uid, token });
  }

  async deleteEmailVerification(uid: string) {
    await this.db.none(sql.deleteEmailVerification, { uid });
  }
}
