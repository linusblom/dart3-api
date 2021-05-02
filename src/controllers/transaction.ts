import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreateTransaction, TransactionType } from 'dart3-sdk';

import { response, errorResponse } from '../utils';
import { db } from '../database';
import { SQLErrorCode } from '../models';

export class TransactionController {
  async getByPlayerUid(ctx: Context, userId: string, uid: string, limit = 15, offset = 0) {
    const transactions = await db.transaction.findByPlayerUid(userId, uid, limit, offset);

    return response(ctx, httpStatusCodes.OK, transactions);
  }

  async create(ctx: Context, userId: string, uid: string, payload: CreateTransaction) {
    try {
      const balance = await db.tx(async (tx) => {
        const player = await tx.player.findByUid(userId, uid);
        let receiverPlayer = player;
        let description = `Authorized by ${ctx.state.authorizedBy.name}`;
        let receiverDescription = description;
        let balance: { balance: string };
        let receiverBalance: { balance: string };

        if (payload.receiverUid) {
          receiverPlayer = await tx.player.findByUid(userId, payload.receiverUid);
          description = `To ${receiverPlayer.name}`;
          receiverDescription = `From ${player.name}`;
        }

        if ([TransactionType.Withdrawal, TransactionType.Transfer].includes(payload.type)) {
          balance = await tx.transaction.debit(
            player.id,
            payload.type,
            payload.amount,
            description,
          );
        }

        if ([TransactionType.Deposit, TransactionType.Transfer].includes(payload.type)) {
          receiverBalance = await tx.transaction.credit(
            receiverPlayer.id,
            payload.type,
            payload.amount,
            receiverDescription,
          );
        }

        ctx.logger.info(
          {
            player: { id: player.id, name: player.name },
            ...(payload.receiverUid && {
              receiverPlayer: { id: receiverPlayer.id, name: receiverPlayer.name },
            }),
            amount: payload.amount,
            type: payload.type,
            authorizedBy: ctx.state.authorizedBy,
          },
          'Transaction',
        );

        return payload.type === TransactionType.Deposit ? receiverBalance : balance;
      });

      return response(ctx, httpStatusCodes.OK, balance);
    } catch (err) {
      if (err.code === SQLErrorCode.CheckViolation) {
        return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE);
      }

      throw err;
    }
  }
}
