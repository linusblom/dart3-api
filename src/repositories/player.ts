import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { Player } from 'dart3-sdk';

import { queryAll, queryOne, queryVoid } from '../database';
import { errorResponse } from '../utils';

export class PlayerRepository {
  async get(ctx: Context, userId: string) {
    const [response, err] = await queryAll<Player>(
      `
      SELECT id, name, email, balance, created_at, deleted_at, color, avatar, xp, pro
      FROM player
      WHERE user_id = $1 AND deleted_at IS NULL;
      `,
      [userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getById(ctx: Context, userId: string, playerId: number) {
    const [response, err] = await queryOne<Player>(
      `
      SELECT p.id, p.name, p.email, p.balance, p.created_at, p.deleted_at, p.color, p.avatar, p.xp, p.pro, SUM(t.bet) - SUM(t.refund) AS turn_over, SUM(t.win) - SUM(t.bet) + SUM(t.refund) AS net
      FROM player AS p
      LEFT JOIN (
        SELECT player_id,
          SUM(CASE WHEN type = 'bet' THEN debit ELSE 0 END) AS bet,
          SUM(CASE WHEN type = 'refund' THEN credit ELSE 0 END) AS refund,
          SUM(CASE WHEN type = 'win' THEN credit ELSE 0 END) AS win
        FROM transaction
        WHERE type IN ('bet', 'refund', 'win')
        GROUP BY player_id, type
      ) AS t
      ON p.id = t.player_id
      WHERE p.id = $1 AND p.user_id = $2 AND p.deleted_at IS NULL
      GROUP BY p.id;
      `,
      [playerId, userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    if (!response) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }

    return response;
  }

  async create(
    ctx: Context,
    userId: string,
    name: string,
    email: string,
    color: string,
    avatar: string,
    pin: string,
  ) {
    const [response, err] = await queryOne<Player>(
      `
      INSERT INTO player (user_id, name, email, color, avatar, pin)
      VALUES ($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')))
      RETURNING id, name, email, balance, created_at, deleted_at, color, avatar, xp, pro, 0 AS turn_over, 0 AS net;
      `,
      [userId, name, email, color, avatar, pin],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async update(ctx: Context, userId: string, playerId: number, name: string, pro: boolean) {
    const err = await queryVoid(
      `
      UPDATE player
      SET name = $1, pro = $2
      WHERE user_id = $3 AND id = $4 AND deleted_at IS NULL;
      `,
      [name, pro, userId, playerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }

  async updatePin(ctx: Context, userId: string, playerId: number, pin: string) {
    const err = await queryVoid(
      `
      UPDATE player
      SET pin = crypt($1, gen_salt('bf'))
      WHERE user_id = $2 AND id = $3 AND deleted_at IS NULL;
      `,
      [pin, userId, playerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }

  async delete(ctx: Context, userId: string, playerId: number) {
    const err = await queryVoid(
      `
      UPDATE player
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL;
      `,
      [userId, playerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }
}
