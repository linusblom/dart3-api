import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { Jackpot, MetaData, User } from 'dart3-sdk';

import { response, errorResponse } from '../utils';
import { db } from '../database';
import { uploadFile } from '../aws';
import { getUser, updateUser } from '../auth0';

export class UserController {
  async get(ctx: Context, userId: string) {
    const user = await getUser(userId);
    const bank = await db.transaction.findBankByUserId(userId);
    const metaData = await db.userMeta.findById(userId);

    return response(ctx, httpStatusCodes.OK, { ...user, metaData, bank });
  }

  async update(ctx: Context, userId: string, { metaData, ...auth0 }: Partial<User>) {
    if (auth0 && Object.keys(auth0).length) {
      await updateUser(userId, auth0);
    }

    if (metaData) {
      await db.userMeta.update(userId, metaData.currency);
    }

    return response(ctx, httpStatusCodes.OK);
  }

  async bootstrap(ctx: Context, userId: string) {
    let jackpot: Jackpot;
    let metaData: MetaData;

    try {
      jackpot = await db.jackpot.get(userId);
      ctx.logger.info({ userId, status: 'Jackpot already initiated' }, 'Bootstrap');
    } catch (err) {
      jackpot = await db.jackpot.init(userId);
      ctx.logger.info({ userId, status: 'Jackpot initiated' }, 'Bootstrap');
    }

    try {
      metaData = await db.userMeta.init(userId);
      ctx.logger.info({ userId, status: 'UserMeta initiated' }, 'Bootstrap');
    } catch (err) {
      metaData = await db.userMeta.findById(userId);
      ctx.logger.info({ userId, status: 'UserMeta already initiated' }, 'Bootstrap');
    }

    return response(ctx, httpStatusCodes.OK, { jackpot, metaData });
  }

  async upload(ctx: Context, userId: string, file: any) {
    try {
      const url = await uploadFile(userId, file);

      return response(ctx, httpStatusCodes.OK, { url });
    } catch (error) {
      if (error.message === 'Unsupported media type') {
        return errorResponse(ctx, httpStatusCodes.UNSUPPORTED_MEDIA_TYPE);
      }

      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, error);
    }
  }
}
