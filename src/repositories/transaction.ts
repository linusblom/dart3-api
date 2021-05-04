import { IDatabase, IMain } from 'pg-promise';
import { Transaction, Bank, TransactionType } from 'dart3-sdk';

import { transaction as sql } from '../database/sql';
import { mapPagination } from '../utils';

export class TransactionRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findBankByUserId(userId: string) {
    return this.db.one<Bank>(sql.findBankByUserId, { userId });
  }

  async findByPlayerUid(userId: string, uid: string, limit: number, offset: number) {
    const response = await this.db.any<Transaction & { total: number }>(sql.findByPlayerUid, {
      userId,
      uid,
      limit,
      offset,
    });

    return mapPagination<Transaction>(response, limit, offset);
  }

  async deletePlayer(playerId: number) {
    return this.db.one<{ balance: number }>(sql.deletePlayer, { playerId });
  }

  async credit(playerId: number, type: TransactionType, amount: number, description = '') {
    return this.db.one<{ balance: string }>(sql.credit, { playerId, type, amount, description });
  }

  async debit(playerId: number, type: TransactionType, amount: number, description = '') {
    return this.db.one<{ balance: string }>(sql.debit, { playerId, type, amount, description });
  }
}
