import { Player, DbId } from 'dart3-sdk';
import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { queryAll, queryOne } from '../database';
import { errorResponse } from '../utils';

export class PlayerRepository {
  async get(ctx: Context, userId: string): Promise<Player[]> {
    const players = await queryAll<Player>(
      `
      SELECT id, name, email, balance, created_at, deleted_at, color, avatar, xp, high_score, one_hundred_eighties, nine_darters
      FROM player
      WHERE user_id = $1 AND deleted_at IS NULL;
      `,
      [userId],
    );

    return players;
  }

  async getById(ctx: Context, userId: string, playerId: number): Promise<Player> {
    const player = await queryOne<Player>(
      `
      SELECT id, name, email, balance, created_at, deleted_at, color, avatar, xp, high_score, one_hundred_eighties, nine_darters
      FROM player
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;
      `,
      [playerId, userId],
    );

    return player ? player : errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  async create(
    ctx: Context,
    userId: string,
    name: string,
    email: string,
    color: string,
    avatar: string,
    pin: string,
  ): Promise<number> {
    const response = await queryOne<DbId>(
      `
      INSERT INTO player (user_id, name, email, color, avatar, pin)
      values($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')))
      RETURNING id;
      `,
      [userId, name, email, color, avatar, pin],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async update(ctx: Context, userId: string, playerId: number, name: string): Promise<number> {
    const response = await queryOne<DbId>(
      `
      UPDATE player
      SET name = $1
      WHERE user_id = $2 AND id = $3 AND deleted_at IS NULL
      RETURNING id;
      `,
      [name, userId, playerId],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async updatePin(ctx: Context, userId: string, playerId: number, pin: string): Promise<number> {
    const response = await queryOne<DbId>(
      `
      UPDATE player
      SET pin = crypt($1, gen_salt('bf'))
      WHERE user_id = $2 AND id = $3 AND deleted_at IS NULL
      RETURNING id;
      `,
      [pin, userId, playerId],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async delete(ctx: Context, userId: string, playerId: number): Promise<number> {
    const response = await queryOne<DbId>(
      `
      UPDATE player
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING id;
      `,
      [userId, playerId],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }
}
