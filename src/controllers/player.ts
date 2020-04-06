import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreatePlayer, UpdatePlayer } from 'dart3-sdk';
import md5 from 'md5';

import { PlayerRepository, TransactionRepository } from '../repositories';
import { randomColor, generatePin, response } from '../utils';
import { sendEmail, generateWelcomeEmail, generateResetPinEmail } from '../aws';

export class PlayerController {
  constructor(
    private repo = new PlayerRepository(),
    private transactionRepo = new TransactionRepository(),
  ) {}

  async get(ctx: Context, accountId: string) {
    const players = await this.repo.get(ctx, accountId);

    return response(
      ctx,
      httpStatusCodes.OK,
      players.map(player => ({ ...player, transactions: [] })),
    );
  }

  async getById(ctx: Context, accountId: string, playerId: number) {
    const player = await this.repo.getById(ctx, accountId, playerId);
    const transactions = await this.transactionRepo.getLatest(ctx, playerId);
    return response(ctx, httpStatusCodes.OK, { ...player, transactions });
  }

  async create(ctx: Context, accountId: string, body: CreatePlayer) {
    const color = randomColor();
    const avatar = `https://www.gravatar.com/avatar/${md5(body.email)}?d=identicon`;
    const pin = generatePin();

    const playerId = await this.repo.create(
      ctx,
      accountId,
      body.name,
      body.email,
      color,
      avatar,
      pin,
    );

    await sendEmail(body.email, generateWelcomeEmail(body.name, pin));

    const player = await this.repo.getById(ctx, accountId, playerId);

    return response(ctx, httpStatusCodes.CREATED, player);
  }

  async update(ctx: Context, accountId: string, playerId: number, body: UpdatePlayer) {
    await this.repo.update(ctx, accountId, playerId, body.name);

    const player = await this.repo.getById(ctx, accountId, playerId);

    return response(ctx, httpStatusCodes.OK, player);
  }

  async resetPin(ctx: Context, accountId: string, playerId: number) {
    const pin = generatePin();

    await this.repo.updatePin(ctx, accountId, playerId, pin);

    const player = await this.repo.getById(ctx, accountId, playerId);

    await sendEmail(player.email, generateResetPinEmail(player.name, pin));

    return response(ctx, httpStatusCodes.OK);
  }

  async delete(ctx: Context, accountId: string, playerId: number) {
    await this.repo.delete(ctx, accountId, playerId);

    return response(ctx, httpStatusCodes.OK);
  }
}
