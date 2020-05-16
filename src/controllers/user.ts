import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { User } from 'dart3-sdk';
import humps from 'humps';

import { Auth0Service } from '../services';
import { response } from '../utils';
import { db } from '../database';

export class UserController {
  constructor(private service = new Auth0Service()) {}

  async get(ctx: Context, userId: string) {
    const user = await this.service.getUser(ctx, userId);
    const bank = await db.transaction.findBankByUserId(userId);

    return response(ctx, httpStatusCodes.OK, { ...humps.camelizeKeys(user), bank });
  }

  async update(ctx: Context, userId: string, body: Partial<User>) {
    const user = await this.service.updateUser(ctx, userId, humps.decamelizeKeys(body));

    return response(ctx, httpStatusCodes.OK, humps.camelizeKeys(user));
  }
}
