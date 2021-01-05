import httpStatusCodes from 'http-status-codes';
import { Game, GameType } from 'dart3-sdk';
import { Logger } from 'pino';

import { errorResponse } from '../utils';
import { db } from '../database';
import { GameService, X01Service, LegsService, HalveItService } from '../services';
import { game as sql } from '../database/sql';

const getGameService = (game: Game, logger: Logger): GameService => {
  switch (game.type) {
    case GameType.X01:
      return new X01Service(game, logger);
    case GameType.Legs:
      return new LegsService(game, logger);
    case GameType.HalveIt:
      return new HalveItService(game, logger);
  }
};

export const gameService = async (ctx, next) => {
  let game: Game;

  try {
    game = await db.one(sql.findCurrent, { userId: ctx.state.userId });
  } catch (err) {
    errorResponse(ctx, httpStatusCodes.NOT_FOUND);
  }

  const service = getGameService(game, ctx.logger);

  ctx.state = { ...ctx.state, service };

  return next();
};
