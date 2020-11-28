import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { User } from 'dart3-sdk';

import { Auth0Service } from '../services';
import { response, errorResponse } from '../utils';
import { db } from '../database';
import { uploadFile } from '../aws';

export class UserController {
  constructor(private service = Auth0Service.getInstance()) {}

  async get(ctx: Context, userId: string) {
    const user = await this.service.getUser(ctx, userId);
    const bank = await db.transaction.findBankByUserId(userId);

    return response(ctx, httpStatusCodes.OK, { ...user, bank });
  }

  async update(ctx: Context, userId: string, body: Partial<User>) {
    const user = await this.service.updateUser(ctx, userId, body);

    return response(ctx, httpStatusCodes.OK, user);
  }

  async bootstrap(ctx: Context, userId: string) {
    const user = await this.service.getUser(ctx, userId);

    if (user.userMetadata && user.userMetadata.bootstrapped) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    await db.jackpot.init(userId);

    await this.service.updateUser(ctx, userId, {
      userMetadata: {
        bootstrapped: true,
        currency: 'kr',
        rake: 0.0,
        jackpotFee: 0.08,
        nextJackpotFee: 0.02,
      },
    });

    return response(ctx, httpStatusCodes.OK);
  }

  async upload(ctx: Context, userId: string, file: any) {
    if (!/image\/(gif|jpeg|png)/.test(file.mimetype)) {
      return errorResponse(ctx, httpStatusCodes.UNSUPPORTED_MEDIA_TYPE);
    }

    try {
      const url = await uploadFile(userId, file);

      return response(ctx, httpStatusCodes.OK, { url });
    } catch (error) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, error);
    }
  }
}
