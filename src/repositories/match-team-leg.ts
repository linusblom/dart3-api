import { throws } from 'assert';
import { DbId, MatchTeam } from 'dart3-sdk';
import { IDatabase, IMain } from 'pg-promise';

import { matchTeamLeg as sql } from '../database/sql';
import { LegData, MatchActive } from '../models';

export class MatchTeamLegRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async create(matchTeamIds: DbId[], startScore: number, set = 1, leg = 1) {
    const data = matchTeamIds.map(({ id }) => ({
      match_team_id: id,
      set,
      leg,
      score: startScore,
    }));
    const cs = new this.pgp.helpers.ColumnSet(['match_team_id', 'set', 'leg', 'score'], {
      table: 'match_team_leg',
    });

    await this.db.none(`${this.pgp.helpers.insert(data, cs)}`);
  }

  async updateScore({ matchTeamId, leg, set }: MatchActive, score: number) {
    await this.db.none(sql.updateScore, { matchTeamId, leg, set, score });
  }

  async updateResults(data: LegData[]) {
    const cs = new this.pgp.helpers.ColumnSet(
      [
        '?match_team_id',
        '?set',
        '?leg',
        'leg_win',
        'set_win',
        'position',
        { name: 'ended_at', mod: '^', def: 'CURRENT_TIMESTAMP' },
      ],
      { table: 'match_team_leg' },
    );

    await this.db.none(
      `${this.pgp.helpers.update(
        data,
        cs,
      )} WHERE v.match_team_id = t.match_team_id AND v.set = t.set AND v.leg = t.leg`,
    );
  }

  async updateBeatenTeams({ set, leg }: MatchActive, matchTeams: Partial<MatchTeam>[]) {
    const data = matchTeams
      .filter(({ position }) => !position)
      .map(({ id, score }, index, array) => ({
        match_team_id: id,
        set,
        leg,
        score: 0,
        position: score !== array[0].score ? index + 1 : null,
      }))
      .filter(({ position }) => !!position);

    if (data.length) {
      const cs = new this.pgp.helpers.ColumnSet(
        ['?match_team_id', '?set', '?leg', 'position', 'score'],
        { table: 'match_team_leg' },
      );

      await this.db.none(
        `${this.pgp.helpers.update(
          data,
          cs,
        )} WHERE v.match_team_id = t.match_team_id AND v.set = t.set AND v.leg = t.leg`,
      );
    }
  }

  async findScoreById(id: number) {
    return this.db.one<{ score: number }>(sql.findScoreById, { id });
  }

  async findTeamsLeftCount({ matchId, set, leg }: MatchActive) {
    return this.db.one<{ teamsLeft: number }>(sql.findTeamsLeftCount, { matchId, set, leg });
  }

  async updatePosition({ matchId, set, leg, matchTeamId }: MatchActive) {
    await this.db.none(sql.updatePosition, { matchId, set, leg, matchTeamId });
  }
}
