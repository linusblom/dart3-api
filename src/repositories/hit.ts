import { IDatabase, IMain } from 'pg-promise';
import { ScoreTotal, Hit } from 'dart3-sdk';

import { hit as sql } from '../database/sql';

export class HitRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findByGameId(gameId: number) {
    return this.db.any<Hit>(sql.findByGameId, { gameId });
  }

  async findByTeamId(teamId: number) {
    return this.db.any<Hit>(sql.findByTeamId, { teamId });
  }

  async create(
    teamId: number,
    playerId: number,
    dart: number,
    round: number,
    leg: number,
    set: number,
    score: ScoreTotal,
    gem: boolean,
  ) {
    return this.db.none(sql.create, { teamId, playerId, dart, round, leg, set, ...score, gem });
  }

  // async getGamePlayerCurrentRound(ctx: Context, gamePlayerId: number) {
  //   const [response, err] = await queryOne<{ round: number }>(
  //     `
  //     SELECT round
  //     FROM game_score
  //     WHERE game_player_id = $1
  //     GROUP BY round
  //     HAVING count(round) = 3
  //     ORDER BY round DESC
  //     LIMIT 1;
  //     `,
  //     [gamePlayerId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   return response ? response.round + 1 : 1;
  // }

  // async getGemCount(ctx: Context, gamePlayerId: number): Promise<number> {
  //   const [response, err] = await queryOne(
  //     `
  //     SELECT COUNT(gs.gem) AS gems, j.id IS NOT NULL AS paid
  //     FROM game_score AS gs
  //     LEFT JOIN jackpot AS j ON gs.game_player_id = j.game_player_id
  //     WHERE gs.game_player_id = $1 AND gs.gem = true
  //     GROUP BY j.id;
  //     `,
  //     [gamePlayerId],
  //   );

  //   if (err) {
  //     return errorResponse(ctx, httpStatusCodes.INTERNAL_SERVER_ERROR, err);
  //   }

  //   console.log(response);

  //   return response && !response.paid ? response.gems : 0;
  // }
}
