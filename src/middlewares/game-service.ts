import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';
import { Game, GameType } from 'dart3-sdk';

import { errorResponse } from '../utils';
import { queryOne } from '../database';
import { GameService, X01Service, LegsService, HalveItService } from '../services';

const getGameService = (game: Game): GameService => {
  switch (game.type) {
    case GameType.Five01DoubleInDoubleOut:
    case GameType.Five01SingleInDoubleOut:
    case GameType.Three01SDoubleInDoubleOut:
    case GameType.Three01SingleInDoubleOut:
      return new X01Service(game);
    case GameType.Legs:
      return new LegsService(game);
    case GameType.HalveIt:
      return new HalveItService(game);
  }
};

export const gameService = async (ctx: Context, next: Function) => {
  const [response, err] = await queryOne<Game>(
    `
    SELECT id, type, mode, team_size, legs, sets, bet, current_team_id, current_leg, current_set, created_at, started_at, ended_at
    FROM game
    WHERE user_id = $1 AND ended_at IS NULL;
    `,
    [ctx.state.userId],
  );

  if (err) {
    return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!response) {
    return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  const service = getGameService(response);

  ctx.state = { ...ctx.state, service };

  return next();
};
