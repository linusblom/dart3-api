import { Context } from 'koa';
import { TransactionType, Transaction, DbId } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryAll } from '../database';
import { errorResponse } from '../utils';

export class TransactionRepository {
  async getUserBank(ctx: Context, userId: string) {
    const bank = await queryOne(
      `
      SELECT COALESCE(SUM(p.balance), 0.00) AS players, COALESCE(SUM(t.turn_over), 0.00) AS turn_over
      FROM player AS p
      INNER JOIN 
      (
        SELECT player_id, SUM(debit) AS turn_over
        FROM transaction
        WHERE type = 'bet'
        GROUP BY player_id
      ) AS t
      ON p.id = t.player_id WHERE p.user_id = $1;
      `,
      [userId],
    );

    return bank;
  }

  async getById(ctx: Context, transactionId: number, playerId: number) {
    const transaction = await queryOne<Transaction>(
      `
      SELECT id, type, debit, credit, balance, created_at, description
      FROM transaction
      WHERE id = $1 AND player_id = $2;
      `,
      [transactionId, playerId],
    );

    return transaction ? transaction : errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  async getLatest(ctx: Context, playerId: number, limit = 10) {
    const transactions = await queryAll<Transaction[]>(
      `
      SELECT id, type, debit, credit, balance, created_at, description FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
      `,
      [playerId, limit],
    );

    return transactions;
  }

  async debit(
    ctx: Context,
    playerId: number,
    type: TransactionType,
    amount: number,
    description: string,
  ) {
    const response = await queryOne<DbId>(
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

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  async credit(
    ctx: Context,
    playerId: number,
    type: TransactionType,
    amount: number,
    description: string,
  ) {
    const response = await queryOne<DbId>(
      `
      INSERT INTO transaction (player_id, type, credit, balance, description)
      SELECT $1, $2, $3, balance + $3, $4 FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      RETURNING id;
      `,
      [playerId, type, amount, description],
    );

    return response ? response.id : errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }
}
