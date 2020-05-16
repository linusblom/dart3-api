import { IDatabase, IMain } from 'pg-promise';
import { CreateGame, Game } from 'dart3-sdk';

import { game as sql } from '../database/sql';

export class GameRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(userId: string, id: number) {
    return this.db.oneOrNone<Game>(sql.findById, { userId, id });
  }

  async findCurrent(userId: string) {
    return this.db.oneOrNone<Game>(sql.findCurrent, { userId });
  }

  async create(userId: string, game: CreateGame) {
    return this.db.one<Game>(sql.create, { userId, ...game });
  }

  async delete(id: number) {
    return this.db.none(sql.delete, { id });
  }

  async start(id: number, currentTeamId: number) {
    return this.db.none(sql.start, { id, currentTeamId });
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
