import { Context } from 'koa';
import { TransactionPayload, TransactionType, Transaction } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { TransactionRepository, PlayerRepository } from '../repositories';
import { response, errorResponse } from '../utils';

export class TransactionController {
  constructor(
    private transactionRepo = new TransactionRepository(),
    private playerRepo = new PlayerRepository(),
  ) {}

  async simple(ctx: Context, playerId: number, body: TransactionPayload) {
    let transaction: Transaction;

    switch (body.type) {
      case TransactionType.Deposit:
        transaction = await this.transactionRepo.credit(
          ctx,
          playerId,
          TransactionType.Deposit,
          body.amount,
          body.description || '',
        );
        break;
      case TransactionType.Withdrawal:
        transaction = await this.transactionRepo.debit(
          ctx,
          playerId,
          TransactionType.Withdrawal,
          body.amount,
          body.description || '',
        );
        break;
      default:
        return errorResponse(ctx, httpStatusCodes.UNSUPPORTED_MEDIA_TYPE);
    }

    return response(ctx, httpStatusCodes.OK, transaction);
  }

  async transfer(
    ctx: Context,
    userId: string,
    fromPlayerId: number,
    toPlayerId: number,
    body: TransactionPayload,
  ) {
    if (body.type !== TransactionType.Transfer) {
      return errorResponse(ctx, httpStatusCodes.UNSUPPORTED_MEDIA_TYPE);
    }

    const fromPlayer = await this.playerRepo.getById(ctx, userId, fromPlayerId);
    const toPlayer = await this.playerRepo.getById(ctx, userId, toPlayerId);
    const transaction = await this.transactionRepo.transfer(ctx, fromPlayer, toPlayer, body.amount);

    return response(ctx, httpStatusCodes.OK, transaction);
  }
}
