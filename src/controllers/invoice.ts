import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { Invoice } from 'dart3-sdk';

import { response } from '../utils';
import { db } from '../database';

export class InvoiceController {
  async get(ctx: Context, userId: string, paid: boolean) {
    return db.task(async t => {
      let paidInvoices: Invoice[] = [];
      const unpaidInvoices = await t.invoice.getUnpaid(userId);

      if (paid) {
        paidInvoices = await t.invoice.getPaid(userId);
      }

      return response(ctx, httpStatusCodes.OK, [...unpaidInvoices, ...paidInvoices]);
    });
  }
}
