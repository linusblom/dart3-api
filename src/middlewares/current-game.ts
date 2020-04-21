import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { queryOne } from '../database';

export const currentGame = async (ctx: Context, next: Function) => {
  const [currentGame, err] = await queryOne(
    `
    SELECT id, type, legs, sets, game_player_id, bet, created_at, started_at, ended_at
    FROM game
    WHERE user_id = $1 AND ended_at IS NULL;
    `,
    [ctx.state.userId],
  );

  if (err) {
    return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!currentGame) {
    return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  ctx.state = { ...ctx.state, currentGame };

  return next();
};
