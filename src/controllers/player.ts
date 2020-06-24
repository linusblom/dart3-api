import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import {
  CreatePlayer,
  UpdatePlayer,
  CreateTransaction,
  Player,
  Transaction,
  DbId,
} from 'dart3-sdk';
import md5 from 'md5';

import { randomColor, generatePin, response, errorResponse } from '../utils';
import { sendEmail, generateResetPinEmail, generateWelcomeEmail } from '../aws';
import { db } from '../database';
import { SQLErrorCode } from '../models';

export class PlayerController {
  async get(ctx: Context, userId: string) {
    const players = await db.player.all(userId);

    return response(ctx, httpStatusCodes.OK, players);
  }

  async getByUid(ctx: Context, userId: string, uid: string) {
    try {
      let player: Player, transactions: Transaction[];

      await db.task(async t => {
        player = await t.player.findByUid(userId, uid);
        transactions = await t.transaction.findByPlayerId(player.id);
      });

      return response(ctx, httpStatusCodes.OK, { ...player, transactions });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }
  }

  async create(ctx: Context, userId: string, body: CreatePlayer) {
    const dev = process.env.NODE_ENV === 'development';
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
    let player: Player;

    await db.task(async t => {
      await t.player.update(userId, uid, body);
      player = await t.player.findByUid(userId, uid);
    });

    return response(ctx, httpStatusCodes.OK, player);
  }

  async resetPin(ctx: Context, userId: string, uid: string) {
    let player: Player;

    const pin = generatePin();

    await db.task(async t => {
      await t.player.updatePin(userId, uid, pin);
      player = await t.player.findByUid(userId, uid);
    });

    await sendEmail(player.email, generateResetPinEmail(player.name, pin));

    return response(ctx, httpStatusCodes.OK);
  }

  async delete(ctx: Context, userId: string, uid: string) {
    await db.player.delete(userId, uid);

    return response(ctx, httpStatusCodes.OK);
  }

  async deposit(ctx: Context, userId: string, uid: string, body: CreateTransaction) {
    let player: DbId, transaction: Transaction;

    await db.task(async t => {
      player = await t.player.findIdByUid(userId, uid);
      transaction = await t.transaction.deposit(player.id, body);
    });

    return response(ctx, httpStatusCodes.OK, transaction);
  }

  async withdrawal(ctx: Context, userId: string, uid: string, body: CreateTransaction) {
    try {
      let player: DbId, transaction: Transaction;

      await db.task(async t => {
        player = await t.player.findIdByUid(userId, uid);
        transaction = await t.transaction.withdrawal(player.id, body);
      });

      return response(ctx, httpStatusCodes.OK, transaction);
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

      return response(ctx, httpStatusCodes.OK, transaction);
    } catch (err) {
      if (err.code === SQLErrorCode.CheckViolation) {
        return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE);
      }

      throw err;
    }
  }
}
