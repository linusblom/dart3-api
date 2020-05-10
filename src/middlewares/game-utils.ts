import httpStatusCodes from 'http-status-codes';
import { Context } from 'koa';

import { errorResponse } from '../utils';
import { queryOne } from '../database';
import { getGameUtils } from '../game-utils';

export const gameUtils = async (ctx: Context, next: Function) => {
  const [game, err] = await queryOne(
    `
    SELECT id, type, variant, legs, sets, game_player_id, bet, created_at, started_at, ended_at, current_leg, current_set
    FROM game
    WHERE user_id = $1 AND ended_at IS NULL;
    `,
    [ctx.state.userId],
  );

  if (err) {
    return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!game) {
    return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
  }

  const gameUtils = getGameUtils(game);

  ctx.state = { ...ctx.state, gameUtils };

  return next();
};
