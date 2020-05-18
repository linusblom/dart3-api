import { IDatabase, IMain } from 'pg-promise';
import { CreateGame, Game, DbId, MatchStatus } from 'dart3-sdk';

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

  async start(id: number, teamPlayerIds: number[][], tournament: boolean) {
    return this.db.tx(async tx => {
      await tx.none('UPDATE game SET started_at = current_timestamp WHERE id = $1', [id]);

      const teamIds: DbId[] = await tx.any(
        `INSERT INTO team (game_id) VALUES ${teamPlayerIds
          .map(() => '($1)')
          .join(',')} RETURNING id;`,
        [id],
      );

      const updateData = teamPlayerIds.reduce(
        (acc, ids, index) => [
          ...acc,
          ...ids.map((id, n) => ({ id, team_id: teamIds[index].id, turn: n + 1 })),
        ],
        [],
      );
      const updateCs = new this.pgp.helpers.ColumnSet(['?id', 'team_id', 'turn'], {
        table: 'team_player',
      });

      await tx.none(`${this.pgp.helpers.update(updateData, updateCs)} WHERE v.id = t.id`);

      let matchTeamIds: DbId[] = [];
      let matchIds: DbId[] = [];

      if (tournament) {
        throw 'not implemented';
      } else {
        matchIds = await tx.any(
          'INSERT INTO match (game_id, status, stage) VALUES ($1, $2, $3) RETURNING id',
          [id, MatchStatus.Ready, 1],
        );

        const insertData = teamIds.map(({ id }, n) => ({
          match_id: matchIds[0].id,
          team_id: id,
          turn: n + 1,
        }));
        const insertCs = new this.pgp.helpers.ColumnSet(['match_id', 'team_id', 'turn'], {
          table: 'match_team',
        });

        matchTeamIds = await tx.any(
          `${this.pgp.helpers.insert(insertData, insertCs)} RETURNING id`,
        );
      }

      await tx.none(
        `UPDATE match SET status = 'playing', started_at = current_timestamp, active_match_team_id = $1 WHERE id = $2`,
        [matchTeamIds[0].id, matchIds[0].id],
      );
    });
  }
}
