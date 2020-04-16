import { Context } from 'koa';
import { TransactionType, Transaction, Bank, Player } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryAll, queryId, transaction } from '../database';
import { errorResponse } from '../utils';
import { SQLError } from '../enums';

export class TransactionRepository {
  async getUserBank(ctx: Context, userId: string): Promise<Bank> {
    const [response, err] = await queryOne(
      `
      SELECT COALESCE(SUM(p.balance), 0.00) AS players, COALESCE(SUM(t.turn_over), 0.00) AS turn_over
      FROM player AS p
      LEFT JOIN 
      (
        SELECT player_id, SUM(debit) - SUM(credit) AS turn_over
        FROM transaction
        WHERE type IN ('bet', 'refund')
        GROUP BY player_id
      ) AS t
      ON p.id = t.player_id
      WHERE p.user_id = $1;
      `,
      [userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async getById(ctx: Context, transactionId: number, playerId: number): Promise<Transaction> {
    const [response, err] = await queryOne(
      `
      SELECT id, type, debit, credit, balance, created_at, description
      FROM transaction
      WHERE id = $1 AND player_id = $2;
      `,
      [transactionId, playerId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    if (!response) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }

    return response;
  }

  async getLatest(ctx: Context, playerId: number, limit = 10): Promise<Transaction[]> {
    const [response, err] = await queryAll(
      `
      SELECT id, type, debit, credit, balance, created_at, description FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
      `,
      [playerId, limit],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async debit(
    ctx: Context,
    playerId: number,
    type: TransactionType,
    amount: number,
    description: string,
  ): Promise<number> {
    const [response, err] = await queryId(
      `
      INSERT INTO transaction (player_id, type, debit, balance, description)
      SELECT $1, $2, $3, balance - $3, $4
      FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      RETURNING id;
      `,
      [playerId, type, amount, description],
    );

    if (err && err.code === SQLError.CheckViolation) {
      return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE, { message: 'Insufficient Funds' });
    }

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async credit(
    ctx: Context,
    playerId: number,
    type: TransactionType,
    amount: number,
    description: string,
  ): Promise<number> {
    const [response, err] = await queryId(
      `
      INSERT INTO transaction (player_id, type, credit, balance, description)
      SELECT $1, $2, $3, balance + $3, $4
      FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      RETURNING id;
      `,
      [playerId, type, amount, description],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async transfer(
    ctx: Context,
    fromPlayer: Player,
    toPlayer: Player,
    amount: number,
  ): Promise<number> {
    const [response, err] = await transaction([
      {
        query: `
          INSERT INTO transaction (player_id, type, debit, balance, description)
          SELECT $1, 'transfer', $2, balance - $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          RETURNING id;
        `,
        params: [fromPlayer.id, amount, `To ${toPlayer.name}`],
      },
      {
        query: `
          INSERT INTO transaction (player_id, type, credit, balance, description)
          SELECT $1, 'transfer', $2, balance + $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          RETURNING id;
        `,
        params: [toPlayer.id, amount, `From ${fromPlayer.name}`],
      },
    ]);

    if (err && err.code === SQLError.CheckViolation) {
      return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE, { message: 'Insufficient Funds' });
    }

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    const [debit] = response;

    return debit.id;
  }
}
