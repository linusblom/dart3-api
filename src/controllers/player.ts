import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreatePlayer, UpdatePlayer, GRAVATAR, Role } from 'dart3-sdk';
import md5 from 'md5';

import { randomColor, generatePin, response, errorResponse } from '../utils';
import {
  sendEmail,
  generateResetPinEmail,
  generateWelcomeEmail,
  generateDisablePinEmail,
  generateVerificationEmail,
} from '../aws';
import { db } from '../database';
import { nanoid } from 'nanoid';

export class PlayerController {
  async get(ctx: Context, userId: string) {
    const players = await db.player.all(userId);

    return response(ctx, httpStatusCodes.OK, players);
  }

  async getByUid(ctx: Context, userId: string, uid: string) {
    try {
      const player = await db.player.findByUid(userId, uid);
      return response(ctx, httpStatusCodes.OK, player);
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }
  }

  async create(ctx: Context, userId: string, payload: CreatePlayer) {
    const color = randomColor();
    const avatar = `https://s.gravatar.com/avatar/${md5(payload.email)}?d=identicon`;
    const pin = generatePin();
    const token = nanoid(64);

    return db.task(async (t) => {
      const player = await t.player.create(userId, payload, color, avatar, pin);
      await t.player.createEmailVerification(player.uid, token);
      await sendEmail(payload.email, generateWelcomeEmail(payload.name, player.uid, token, pin));

      return response(ctx, httpStatusCodes.CREATED, player);
    });
  }

  async update(ctx: Context, userId: string, uid: string, payload: UpdatePlayer) {
    return db.task(async (t) => {
      let avatar = payload.avatar;

      if (avatar === GRAVATAR) {
        const { email } = await t.player.findByUid(userId, uid);
        avatar = `https://s.gravatar.com/avatar/${md5(email)}?d=identicon`;
      }

      await t.player.toggleRoles(userId, uid, payload.roles, [Role.Pro]);
      await t.player.update(userId, uid, { ...payload, avatar });

      const player = await t.player.findByUid(userId, uid);

      return response(ctx, httpStatusCodes.OK, player);
    });
  }

  async resetPin(ctx: Context, userId: string, uid: string) {
    const pin = generatePin();

    return db.task(async (t) => {
      await t.player.updatePin(userId, uid, pin);
      const player = await t.player.findByUid(userId, uid);

      await sendEmail(player.email, generateResetPinEmail(player.name, pin));

      ctx.logger.info({ uid: player.uid }, 'Reset PIN');

      return response(ctx, httpStatusCodes.OK);
    });
  }

  async disablePin(ctx: Context, userId: string, uid: string) {
    return db.task(async (t) => {
      await t.player.toggleRoles(userId, uid, [], [Role.Pin]);

      const player = await t.player.findByUid(userId, uid);
      await sendEmail(player.email, generateDisablePinEmail(player.name));

      ctx.logger.info({ uid: player.uid }, 'Disable PIN');

      return response(ctx, httpStatusCodes.OK);
    });
  }

  async delete(ctx: Context, userId: string, uid: string) {
    return db.tx(async (t) => {
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

  async statistics(ctx: Context, userId: string, uid: string) {
    const statistics = await db.player.findStatisticsByUid(userId, uid);

    return response(ctx, httpStatusCodes.OK, statistics);
  }

  async sendEmailVerification(ctx: Context, userId: string, uid: string) {
    return db.tx(async (t) => {
      const player = await t.player.findByUid(userId, uid);
      const token = nanoid(64);
      await t.player.createEmailVerification(uid, token);

      await sendEmail(player.email, generateVerificationEmail(player.name, uid, token));

      return response(ctx, httpStatusCodes.OK);
    });
  }
}
