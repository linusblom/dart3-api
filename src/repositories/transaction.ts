import { IDatabase, IMain } from 'pg-promise';
import { Transaction, CreateTransaction, Bank, TransactionType } from 'dart3-sdk';

import { transaction as sql } from '../database/sql';

export class TransactionRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findBankByUserId(userId: string) {
    return this.db.one<Bank>(sql.findBankByUserId, { userId });
  }

  async findByPlayerId(playerId: number, limit = 10) {
    return this.db.any<Transaction>(sql.findByPlayerId, { playerId, limit });
  }

  async deposit(playerId: number, transaction: CreateTransaction) {
    return this.db.one<Transaction>(sql.credit, {
      playerId,
      description: '',
      type: TransactionType.Deposit,
      ...transaction,
    });
  }

  async withdrawal(playerId: number, transaction: CreateTransaction) {
    return this.db.one<Transaction>(sql.debit, {
      playerId,
      description: '',
      type: TransactionType.Withdrawal,
      ...transaction,
    });
  }

  async transfer(userId: string, uid: string, receiverUid: string, transaction: CreateTransaction) {
    return this.db.tx(async tx => {
      const player = await tx.one('SELECT id, name FROM player WHERE user_id = $1 AND uid = $2', [
        userId,
        uid,
      ]);
      const receiverPlayer = await tx.one(
        'SELECT id, name FROM player WHERE user_id = $1 AND uid = $2',
        [userId, receiverUid],
      );

      const debit: Transaction = await tx.one(sql.debit, {
        playerId: player.id,
        description: `To ${receiverPlayer.name}`,
        type: TransactionType.Transfer,
        ...transaction,
      });

      await tx.one(sql.credit, {
        playerId: receiverPlayer.id,
        description: `From ${player.name}`,
        type: TransactionType.Transfer,
        ...transaction,
      });

      return debit;
    });
  }
}
