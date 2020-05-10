import { Context } from 'koa';
import { TransactionType, Transaction, Bank, Player } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryAll, transaction } from '../database';
import { errorResponse } from '../utils';
import { SQLErrorCode } from '../models';

export class TransactionRepository {
  async getUserBank(ctx: Context, userId: string) {
    const [response, err] = await queryOne<Bank>(
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

  async getById(ctx: Context, transactionId: number, playerId: number) {
    const [response, err] = await queryOne<Transaction>(
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

  async getLatest(ctx: Context, playerId: number, limit = 10) {
    const [response, err] = await queryAll<Transaction>(
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
  ) {
    const [response, err] = await queryOne<Transaction>(
      `
      INSERT INTO transaction (player_id, type, debit, balance, description)
      SELECT $1, $2, $3, balance - $3, $4
      FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      RETURNING id, type, debit, credit, balance, created_at, description;;
      `,
      [playerId, type, amount, description],
    );

    if (err && err.code === SQLErrorCode.CheckViolation) {
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
  ) {
    const [response, err] = await queryOne<Transaction>(
      `
      INSERT INTO transaction (player_id, type, credit, balance, description)
      SELECT $1, $2, $3, balance + $3, $4
      FROM transaction
      WHERE player_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      RETURNING id, type, debit, credit, balance, created_at, description;
      `,
      [playerId, type, amount, description],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async transfer(ctx: Context, fromPlayer: Player, toPlayer: Player, amount: number) {
    const [response, err] = await transaction([
      {
        query: `
          INSERT INTO transaction (player_id, type, debit, balance, description)
          SELECT $1, 'transfer', $2, balance - $2, $3
          FROM transaction
          WHERE player_id = $1
          ORDER BY created_at DESC
          LIMIT 1
          RETURNING id, type, debit, credit, balance, created_at, description;
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
          LIMIT 1;
        `,
        params: [toPlayer.id, amount, `From ${fromPlayer.name}`],
      },
    ]);

    if (err && err.code === SQLErrorCode.CheckViolation) {
      return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE, { message: 'Insufficient Funds' });
    }

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    const [debit] = response as Transaction[];

    return debit;
  }
}
