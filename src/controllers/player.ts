import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreatePlayer, UpdatePlayer } from 'dart3-sdk';
import md5 from 'md5';

import { PlayerRepository, TransactionRepository } from '../repositories';
import { randomColor, generatePin, response } from '../utils';
import { sendEmail, generateResetPinEmail } from '../aws';

export class PlayerController {
  constructor(
    private playerRepo = new PlayerRepository(),
    private transactionRepo = new TransactionRepository(),
  ) {}

  async get(ctx: Context, userId: string) {
    const players = await this.playerRepo.get(ctx, userId);

    return response(
      ctx,
      httpStatusCodes.OK,
      players.map(player => ({ ...player, transactions: [] })),
    );
  }

  async getById(ctx: Context, userId: string, playerId: number) {
    const player = await this.playerRepo.getById(ctx, userId, playerId);
    const transactions = await this.transactionRepo.getLatest(ctx, playerId);
    return response(ctx, httpStatusCodes.OK, { ...player, transactions });
  }

  async create(ctx: Context, userId: string, body: CreatePlayer) {
    const color = randomColor();
    const avatar = `https://s.gravatar.com/avatar/${md5(body.email)}?d=identicon`;
    const pin = '1111'; // generatePin();

    const player = await this.playerRepo.create(ctx, userId, body, color, avatar, pin);

    // await sendEmail(body.email, generateWelcomeEmail(body.name, pin));

    return response(ctx, httpStatusCodes.CREATED, player);
  }

  async update(ctx: Context, userId: string, playerId: number, body: UpdatePlayer) {
    await this.playerRepo.update(ctx, userId, playerId, body);

    const player = await this.playerRepo.getById(ctx, userId, playerId);

    return response(ctx, httpStatusCodes.OK, player);
  }

  async resetPin(ctx: Context, userId: string, playerId: number) {
    const pin = generatePin();

    await this.playerRepo.updatePin(ctx, userId, playerId, pin);

    const player = await this.playerRepo.getById(ctx, userId, playerId);

    await sendEmail(player.email, generateResetPinEmail(player.name, pin));

    return response(ctx, httpStatusCodes.OK);
  }

  async delete(ctx: Context, userId: string, playerId: number) {
    await this.playerRepo.delete(ctx, userId, playerId);

    return response(ctx, httpStatusCodes.OK);
  }
}
