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

  async transfer(playerId: number, receiverPlayerId: number, transaction: CreateTransaction) {
    return await this.db.tx(async tx => {
      const player = await tx.one('SELECT name, user_id FROM player WHERE id = $1', [playerId]);
      const receiverPlayer = await tx.one(
        'SELECT name FROM player WHERE id = $1 AND user_id = $2',
        [receiverPlayerId, player.userId],
      );

      const debit: Transaction = await tx.one(sql.debit, {
        playerId,
        description: `To ${receiverPlayer.name}`,
        type: TransactionType.Transfer,
        ...transaction,
      });

      await tx.one(sql.credit, {
        playerId: receiverPlayerId,
        description: `From ${player.name}`,
        type: TransactionType.Transfer,
        ...transaction,
      });

      return debit;
    });
  }
}
