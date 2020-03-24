import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';
import { CreatePlayer } from 'dart3-sdk';
import md5 from 'md5';

import { PlayerRepository } from '../repositories/player';
import { errorResponse } from '../utils';
import { randomColor } from '../utils/random-color';

export class PlayerController {
  constructor(private repo = new PlayerRepository()) {}

  async get(ctx: Context, accountId: string) {
    return await this.repo.get(accountId);
  }

  async getById(ctx: Context, accountId: string, playerId: string) {
    const player = await this.repo.getById(playerId, accountId);
    return player ? player : errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  async create(ctx: Context, accountId: string, body: CreatePlayer) {
    const color = randomColor();
    const avatar = `https://www.gravatar.com/avatar/${md5(body.email)}?d=identicon`;

    const id = await this.repo.create(accountId, body.name, body.email, color, avatar);
    return await this.getById(ctx, accountId, id);
  }
}
