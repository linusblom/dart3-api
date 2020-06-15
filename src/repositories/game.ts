import { IDatabase, IMain } from 'pg-promise';
import { CreateGame, Game, DbId, MatchStatus } from 'dart3-sdk';
import { nanoid } from 'nanoid';

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
    return this.db.one<Game>(sql.create, { userId, uid: nanoid(20), ...game });
  }

  async delete(id: number) {
    return this.db.none(sql.delete, { id });
  }

  async start(id: number, tournament: boolean, startScore: number, teamPlayerIds: number[][]) {
    return this.db.tx(async tx => {
      const { ColumnSet, update, insert } = this.pgp.helpers;

      const teamData = teamPlayerIds.map(() => ({ game_id: id }));
      const teamCs = new ColumnSet(['game_id'], { table: 'team' });
      const teamIds = await tx.any(`${insert(teamData, teamCs)} RETURNING id`);

      const teamPlayerData = teamPlayerIds.reduce(
        (acc, ids, index) => [...acc, ...ids.map(id => ({ id, team_id: teamIds[index].id }))],
        [],
      );
      const teamPlayerCs = new ColumnSet(['?id', 'team_id'], { table: 'team_player' });
      await tx.none(`${update(teamPlayerData, teamPlayerCs)} WHERE v.id = t.id`);

      let matchTeamIds: DbId[] = [];
      let matchIds: DbId[] = [];

      if (tournament) {
        throw 'not implemented';
      } else {
        matchIds = await tx.any(
          'INSERT INTO match (game_id, status, stage) VALUES ($1, $2, $3) RETURNING id',
          [id, MatchStatus.Ready, 1],
        );

        const matchTeamData = teamIds.map(({ id }) => ({
          match_id: matchIds[0].id,
          team_id: id,
          score: startScore,
        }));
        const matchTeamCs = new ColumnSet(['match_id', 'team_id', 'score'], {
          table: 'match_team',
        });
        matchTeamIds = await tx.any(`${insert(matchTeamData, matchTeamCs)} RETURNING id`);
      }

      await tx.none(
        `UPDATE match SET status = $1, started_at = current_timestamp, active_match_team_id = $2 WHERE id = $3`,
        [MatchStatus.Playing, matchTeamIds[0].id, matchIds[0].id],
      );
      await tx.none(
        `
        UPDATE jackpot j SET value = value + g.prize_pool * 0.08, next_value = next_value + g.prize_pool * 0.02
        FROM (SELECT user_id, prize_pool FROM game WHERE id = $1) AS g
        WHERE j.user_id = g.user_id AND won_at IS NULL
        `,
        [id],
      );
      await tx.none(
        'UPDATE game SET started_at = current_timestamp, prize_pool = prize_pool * 0.9 WHERE id = $1',
        [id],
      );
    });
  }
}
