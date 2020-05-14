import { Context } from 'koa';
import { Game, CreateGame } from 'dart3-sdk';
import httpStatusCodes from 'http-status-codes';

import { queryOne, queryVoid } from '../database';
import { errorResponse } from '../utils';
import { SQLErrorCode } from '../models';

export class GameRepository {
  async getById(ctx: Context, userId: string, gameId: number) {
    const [response, err] = await queryOne<Game>(
      `
      SELECT id, type, mode, team_size, legs, sets, bet, current_team_id, current_leg, current_set, created_at, started_at, ended_at
      FROM game
      WHERE id = $1 AND user_id = $2;
      `,
      [gameId, userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    if (!response) {
      return errorResponse(ctx, httpStatusCodes.NOT_FOUND);
    }

    return response;
  }

  async getCurrentGame(ctx: Context, userId: string) {
    const [response, err] = await queryOne<Game>(
      `
      SELECT id, type, mode, team_size, legs, sets, bet, current_team_id, current_leg, current_set, created_at, started_at, ended_at
      FROM game
      WHERE user_id = $1 AND ended_at IS NULL;
      `,
      [userId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async create(ctx: Context, userId: string, game: CreateGame) {
    const [response, err] = await queryOne<Game>(
      `
      INSERT INTO game (user_id, type, mode, team_size, legs, sets, bet)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, type, mode, team_size, legs, sets, bet, current_team_id, current_leg, current_set, created_at, started_at, ended_at;
      `,
      [userId, game.type, game.mode, game.teamSize, game.legs, game.sets, game.bet],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return response;
  }

  async delete(ctx: Context, gameId: number) {
    const err = await queryVoid(
      `
      DELETE FROM game
      WHERE id = $1 AND started_at IS NULL;
      `,
      [gameId],
    );

    if (err && err.code === SQLErrorCode.ForeignKeyViolation) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }

  async start(ctx: Context, gameId: number, startTeamId: number) {
    const err = await queryVoid(
      `
      UPDATE game
      SET started_at = CURRENT_TIMESTAMP, current_team_id = $1
      WHERE id = $2;
      `,
      [startTeamId, gameId],
    );

    if (err) {
      return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
    }

    return;
  }

  // async start(ctx: Context, gameId: number, variant: GameVariant) {
  //   const [players] = await queryAll<GamePlayer & Player>(
  //     `
  //     SELECT gp.id, p.pro
  //     FROM game_player gp
  //     LEFT JOIN player p ON p.id = gp.player_id
  //     WHERE game_id = $1;
  //     `,
  //     [gameId],
  //   );

  //   let playerOrder: { id: number; turn: number; team: number }[] = [];

  //   if (variant === GameVariant.Double) {
  //     playerOrder = players
  //       .sort((a, b) => (a.pro === b.pro ? Math.random() - 0.5 : a.pro ? 1 : -1))
  //       .map(({ id }, index, array) => ({
  //         id,
  //         turn: index + 1,
  //         team:
  //           index < array.length / 2
  //             ? index + 1
  //             : Math.ceil(index + 1 - Math.ceil(array.length / 2)),
  //       }));
  //   } else {
  //     playerOrder = players
  //       .map(({ id }, index) => ({ id, turn: index + 1, team: index + 1 }))
  //       .sort(() => Math.random() - 0.5);
  //   }

  //   await Promise.all(
  //     playerOrder.map(
  //       async ({ id, turn, team }) =>
  //         await queryVoid('UPDATE game_player SET turn = $1, team = $2 WHERE id = $3;', [
  //           turn,
  //           team,
  //           id,
  //         ]),
  //     ),
  //   );

  //   const err = await queryVoid(
  //     `
  //     UPDATE game
  //     SET started_at = CURRENT_TIMESTAMP, game_player_id = $1, current_leg = 1, current_set = 1
  //     WHERE id = $2;
  //     `,
  //     [playerOrder[0].id, gameId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return;
  // }

  // async nextPlayer(ctx: Context, gameId: number) {
  //   const [response, err] = await queryOne<{ gamePlayerId: number; lastTurn: boolean }>(
  //     `
  //     UPDATE game
  //     SET game_player_id = (
  //       SELECT COALESCE((
  //         SELECT id
  //         FROM game_player
  //         WHERE game_id = $1 AND turn = (
  //           SELECT turn
  //           FROM game_player
  //           WHERE id = game_player_id
  //         ) + 1
  //       ), (
  //         SELECT id
  //         FROM game_player
  //         WHERE game_id = $1 AND turn = 1
  //       ))
  //     )
  //     WHERE id = $1
  //     RETURNING (
  //       SELECT turn = 1 AS last_turn
  //       FROM game_player
  //       WHERE id = game_player_id
  //     ), game_player_id;
  //     `,
  //     [gameId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return response;
  // }
}
