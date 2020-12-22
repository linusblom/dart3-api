import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreatePlayer, UpdatePlayer, CreateTransaction, GRAVATAR } from 'dart3-sdk';
import md5 from 'md5';

import { randomColor, generatePin, response, errorResponse } from '../utils';
import {
  sendEmail,
  generateResetPinEmail,
  generateWelcomeEmail,
  generateDisablePinEmail,
} from '../aws';
import { db } from '../database';
import { SQLErrorCode } from '../models';
import { Auth0Service } from '../services';

export class PlayerController {
  constructor(private auth0 = Auth0Service.getInstance()) {}

  async get(ctx: Context, userId: string) {
    const players = await db.player.all(userId);

    return response(ctx, httpStatusCodes.OK, players);
  }

  async getByUid(ctx: Context, userId: string, uid: string) {
    try {
      return db.task(async t => {
        const player = await t.player.findByUid(userId, uid);
        const transactions = await t.transaction.findByPlayerId(player.id);
        const statistics = await t.player.findStatisticsById(player.id);

        return response(ctx, httpStatusCodes.OK, { ...player, transactions, statistics });
      });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }
  }

  async create(ctx: Context, userId: string, body: CreatePlayer) {
    const dev = process.env.ENV === 'development';
    const color = randomColor();
    const avatar = `https://s.gravatar.com/avatar/${md5(body.email)}?d=identicon`;
    const pin = dev ? '1111' : generatePin();

    const player = await db.player.create(userId, body, color, avatar, pin);

    if (!dev) {
      await sendEmail(body.email, generateWelcomeEmail(body.name, pin));
    }

    return response(ctx, httpStatusCodes.CREATED, { ...player, transactions: [] });
  }

  async update(ctx: Context, userId: string, uid: string, body: UpdatePlayer) {
    return db.task(async t => {
      let avatar = body.avatar;

      if (avatar === GRAVATAR) {
        const player = await t.player.findByUid(userId, uid);
        avatar = `https://s.gravatar.com/avatar/${md5(player.email)}?d=identicon`;
      }

      await t.player.update(userId, uid, { ...body, avatar });
      const player = await t.player.findByUid(userId, uid);

      return response(ctx, httpStatusCodes.OK, player);
    });
  }

  async resetPin(ctx: Context, userId: string, uid: string) {
    const pin = generatePin();

    return db.task(async t => {
      await t.player.updatePin(userId, uid, pin);
      const player = await t.player.findByUid(userId, uid);

      await sendEmail(player.email, generateResetPinEmail(player.name, pin));

      ctx.logger.info({ uid: player.uid }, 'Reset PIN');

      return response(ctx, httpStatusCodes.OK);
    });
  }

  async disablePin(ctx: Context, userId: string, uid: string) {
    return db.task(async t => {
      await t.player.disablePin(userId, uid);
      const player = await t.player.findByUid(userId, uid);

      await sendEmail(player.email, generateDisablePinEmail(player.name));

      ctx.logger.info({ uid: player.uid }, 'Disable PIN');

      return response(ctx, httpStatusCodes.OK);
    });
  }

  async delete(ctx: Context, userId: string, uid: string) {
    return db.tx(async t => {
      const metaData = await t.userMeta.findById(userId);
      const { id } = await t.player.delete(userId, uid);
      const { balance } = await t.transaction.deletePlayer(id);
      const value = balance * metaData.jackpotFee;
      const nextValue = balance * metaData.nextJackpotFee;

      await t.jackpot.increaseByValues(userId, value, nextValue);

      ctx.logger.info({ uid, balance, jackpot: { value, nextValue } }, 'Player deleted');

      return response(ctx, httpStatusCodes.OK);
    });
  }

  async deposit(ctx: Context, userId: string, uid: string, body: CreateTransaction) {
    return db.task(async t => {
      const player = await t.player.findIdByUid(userId, uid);
      const transaction = await t.transaction.deposit(player.id, body);

      ctx.logger.info({ to: uid, ...body }, 'Deposit');

      return response(ctx, httpStatusCodes.OK, transaction);
    });
  }

  async withdrawal(ctx: Context, userId: string, uid: string, body: CreateTransaction) {
    try {
      return db.task(async t => {
        const player = await t.player.findIdByUid(userId, uid);
        const transaction = await t.transaction.withdrawal(player.id, body);

        ctx.logger.info({ from: uid, ...body }, 'Withdrawal');

        return response(ctx, httpStatusCodes.OK, transaction);
      });
    } catch (err) {
      if (err.code === SQLErrorCode.CheckViolation) {
        return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE);
      }

      throw err;
    }
  }

  async transfer(
    ctx: Context,
    userId: string,
    uid: string,
    receiverUid: string,
    body: CreateTransaction,
  ) {
    try {
      const transaction = await db.transaction.transfer(userId, uid, receiverUid, body);

      ctx.logger.info({ from: uid, to: receiverUid, ...body }, 'Transfer');

      return response(ctx, httpStatusCodes.OK, transaction);
    } catch (err) {
      if (err.code === SQLErrorCode.CheckViolation) {
        return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE);
      }

      throw err;
    }
  }
}
