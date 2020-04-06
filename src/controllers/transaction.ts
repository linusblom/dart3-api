import { Context } from 'koa';
import { TransactionPayload, TransactionType } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { TransactionRepository, PlayerRepository } from '../repositories';
import { response, errorResponse } from '../utils';

export class TransactionController {
  constructor(
    private repo = new TransactionRepository(),
    private playerRepo = new PlayerRepository(),
  ) {}

  async bankToPlayer(ctx: Context, playerId: number, body: TransactionPayload) {
    let transactionId: number;

    switch (body.type) {
      case TransactionType.Deposit:
        transactionId = await this.repo.credit(
          ctx,
          playerId,
          TransactionType.Deposit,
          body.amount,
          body.description || '',
        );
        break;
      case TransactionType.Withdrawal:
        transactionId = await this.repo.debit(
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

    const transaction = await this.repo.getById(ctx, transactionId, playerId);

    return response(ctx, httpStatusCodes.OK, transaction);
  }

  async playerToPlayer(
    ctx: Context,
    accountId: string,
    fromPlayerId: number,
    toPlayerId: number,
    body: TransactionPayload,
  ) {
    if (body.type !== TransactionType.Transfer) {
      return errorResponse(ctx, httpStatusCodes.UNSUPPORTED_MEDIA_TYPE);
    }

    const fromPlayer = await this.playerRepo.getById(ctx, accountId, fromPlayerId);
    const toPlayer = await this.playerRepo.getById(ctx, accountId, toPlayerId);

    const transactionId = await this.repo.debit(
      ctx,
      fromPlayerId,
      TransactionType.Transfer,
      body.amount,
      `Transfer to ${toPlayer.name}`,
    );

    await this.repo.credit(
      ctx,
      toPlayerId,
      TransactionType.Transfer,
      body.amount,
      `Transfer from ${fromPlayer.name}`,
    );

    const transaction = await this.repo.getById(ctx, transactionId, fromPlayerId);

    return response(ctx, httpStatusCodes.OK, transaction);
  }
}
