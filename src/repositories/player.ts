import { Player } from 'dart3-sdk';
import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { queryAll, queryOne } from '../database';
import { errorResponse } from '../utils';

export class PlayerRepository {
  async get(ctx: Context, accountId: string): Promise<Player[]> {
    const players = await queryAll(
      'SELECT * FROM player where account_id = $1 AND deleted_at IS NULL',
      [accountId],
    );

    return players;
  }

  async getById(ctx: Context, accountId: string, playerId: number): Promise<Player> {
    const player = await queryOne(
      'SELECT * FROM player where id = $1 AND account_id = $2 AND deleted_at IS NULL',
      [playerId, accountId],
    );

    return player ? player : errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  async create(
    ctx: Context,
    accountId: string,
    name: string,
    email: string,
    color: string,
    avatar: string,
    pin: string,
  ): Promise<number> {
    const player = await queryOne(
      "INSERT INTO player (account_id, name, email, color, avatar, pin) values($1, $2, $3, $4, $5, crypt($6, gen_salt('bf'))) RETURNING id",
      [accountId, name, email, color, avatar, pin],
    );

    return player ? player.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async update(ctx: Context, accountId: string, playerId: number, name: string): Promise<number> {
    const player = await queryOne(
      'UPDATE player SET name = $1 WHERE account_id = $2 AND id = $3 AND deleted_at IS NULL RETURNING id',
      [name, accountId, playerId],
    );

    return player ? player.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async updatePin(ctx: Context, accountId: string, playerId: number, pin: string): Promise<number> {
    const player = await queryOne(
      "UPDATE player SET pin = crypt($1, gen_salt('bf')) WHERE account_id = $2 AND id = $3 AND deleted_at IS NULL RETURNING id",
      [pin, accountId, playerId],
    );

    return player ? player.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async delete(ctx: Context, accountId: string, playerId: number): Promise<number> {
    const player = await queryOne(
      'UPDATE player SET deleted_at = CURRENT_TIMESTAMP WHERE account_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING id',
      [accountId, playerId],
    );

    return player ? player.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }
}
