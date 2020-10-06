import { IDatabase, IMain } from 'pg-promise';
import { Invoice } from 'dart3-sdk';

import { invoice as sql } from '../database/sql';

export class InvoiceRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async getUnpaid(userId: string) {
    return this.db.any<Invoice>(sql.findUnpaid, { userId });
  }

  async getPaid(userId: string) {
    return this.db.any<Invoice>(sql.findPaid, { userId });
  }
}
