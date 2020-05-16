import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreatePlayer, UpdatePlayer, CreateTransaction } from 'dart3-sdk';
import md5 from 'md5';

import { randomColor, generatePin, response, errorResponse } from '../utils';
import { sendEmail, generateResetPinEmail, generateWelcomeEmail } from '../aws';
import { db } from '../database';
import { SQLErrorCode } from '../models';

export class PlayerController {
  async all(ctx: Context, userId: string) {
    const players = await db.player.all(userId); // this.playerRepo.get(ctx, userId);

    return response(
      ctx,
      httpStatusCodes.OK,
      players.map(player => ({ ...player, transactions: [] })),
    );
  }

  async findById(ctx: Context, userId: string, playerId: number) {
    try {
      const player = await db.player.findById(userId, playerId);
      const transactions = await db.transaction.findByPlayerId(playerId);

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

    return response(ctx, httpStatusCodes.CREATED, player);
  }

  async update(ctx: Context, userId: string, playerId: number, body: UpdatePlayer) {
    await db.player.update(userId, playerId, body);

    const player = await this.findById(ctx, userId, playerId);

    return response(ctx, httpStatusCodes.OK, player);
  }

  async resetPin(ctx: Context, userId: string, playerId: number) {
    const pin = generatePin();

    await db.player.updatePin(userId, playerId, pin);

    const player = await this.findById(ctx, userId, playerId);

    await sendEmail(player.email, generateResetPinEmail(player.name, pin));

    return response(ctx, httpStatusCodes.OK);
  }

  async delete(ctx: Context, userId: string, playerId: number) {
    await db.player.delete(userId, playerId);

    return response(ctx, httpStatusCodes.OK);
  }

  async deposit(ctx: Context, playerId: number, body: CreateTransaction) {
    const transaction = await db.transaction.deposit(playerId, body);

    return response(ctx, httpStatusCodes.OK, transaction);
  }

  async withdrawal(ctx: Context, playerId: number, body: CreateTransaction) {
    try {
      const transaction = await db.transaction.withdrawal(playerId, body);

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
    playerId: number,
    receiverPlayerId: number,
    body: CreateTransaction,
  ) {
    try {
      const transaction = await db.transaction.transfer(playerId, receiverPlayerId, body);

      return response(ctx, httpStatusCodes.OK, transaction);
    } catch (err) {
      if (err.code === SQLErrorCode.CheckViolation) {
        return errorResponse(ctx, httpStatusCodes.NOT_ACCEPTABLE);
      }

      throw err;
    }
  }
}
