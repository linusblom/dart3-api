import { IDatabase, IMain, ITask } from 'pg-promise';
import { Transaction, CreateTransaction, Bank, TransactionType } from 'dart3-sdk';

import * as sql from '../database/sql';
import { Extensions } from './index';

export class TransactionRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findBankByUserId(userId: string) {
    return this.db.one<Bank>(sql.transaction.findBankByUserId, { userId });
  }

  async findByPlayerId(playerId: number, limit = 10) {
    return this.db.any<Transaction>(sql.transaction.findByPlayerId, { playerId, limit });
  }

  async deletePlayer(playerId: number) {
    return this.db.one<{ balance: number }>(sql.transaction.deletePlayer, { playerId });
  }

  async credit(playerId: number, type: TransactionType, transaction: CreateTransaction) {
    return this.db.one<Transaction>(sql.transaction.credit, {
      playerId,
      type,
      description: '',
      ...transaction,
    });
  }

  async debit(playerId: number, type: TransactionType, transaction: CreateTransaction) {
    return this.db.one<Transaction>(sql.transaction.debit, {
      playerId,
      type,
      description: '',
      ...transaction,
    });
  }

  async transfer(userId: string, uid: string, receiverUid: string, transaction: CreateTransaction) {
    return this.db.tx(async (tx: ITask<Extensions> & Extensions) => {
      const player = await tx.one(sql.player.findNameByUid, { userId, uid });
      const receiverPlayer = await tx.one(sql.player.findNameByUid, { userId, uid: receiverUid });

      const debit = await tx.transaction.debit(player.id, TransactionType.Transfer, {
        ...transaction,
        description: `To ${receiverPlayer.name}`,
      });
      await tx.transaction.credit(receiverPlayer.id, TransactionType.Transfer, {
        ...transaction,
        description: `From ${player.name}`,
      });

      return debit;
    });
  }
}
