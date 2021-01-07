import { IDatabase, IMain } from 'pg-promise';
import { DbId, MatchTeam } from 'dart3-sdk';

import { matchTeam as sql } from '../database/sql';
import { MatchActive, MatchWinner, NextMatchTeam, MatchResult } from '../models';

export class MatchTeamRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(id: number) {
    return this.db.one<MatchTeam>(sql.findById, { id });
  }

  async findByGameId(gameId: number) {
    return this.db.any<MatchTeam>(sql.findByGameIdWithLeg, { gameId });
  }

  async create(matchIds: DbId[], teamIds: DbId[]) {
    const data = teamIds.map(({ id }, index) => ({
      match_id: matchIds[0].id,
      team_id: id,
      order: index + 1,
    }));
    const cs = new this.pgp.helpers.ColumnSet(['match_id', 'team_id', 'order'], {
      table: 'match_team',
    });

    return await this.db.any<DbId>(`${this.pgp.helpers.insert(data, cs)} RETURNING id`);
  }

  async findByMatchIdWithOrder(matchId: number) {
    return this.db.any<MatchTeam>(sql.findByMatchIdWithOrder, { matchId });
  }

  async updateOrder(data: { id: number; order: number }[]) {
    const cs = new this.pgp.helpers.ColumnSet(['?id', 'order'], { table: 'match_team' });

    await this.db.none(`${this.pgp.helpers.update(data, cs)} WHERE v.id = t.id`);
  }

  async updateGems(id: number, gems: number) {
    await this.db.none(sql.updateGems, { id, gems });
  }

  async findNextOrder({ matchId, order, set, leg }: MatchActive) {
    return this.db.any<NextMatchTeam>(sql.findNextOrder, { matchId, order, set, leg });
  }

  async findByMatchIdWithLeg({ matchId, set, leg }: MatchActive, orderBy: string[]) {
    const orderByString = orderBy.reduce(
      (acc, o, i) => `${acc}d.${o}${i < orderBy.length - 1 ? ', ' : ''}`,
      '',
    );

    return this.db.any<Partial<MatchTeam>>(sql.findByMatchIdWithLeg, {
      matchId,
      set,
      leg,
      orderBy: `ORDER BY ${orderByString}`,
    });
  }

  async findByMatchIdAndOrder(matchId: number, order: number) {
    return this.db.one<DbId>(sql.findByMatchIdAndOrder, { matchId, order });
  }

  async findResultsByMatchId(matchId: number) {
    return this.db.any<MatchResult>(sql.findResultsByMatchId, { matchId });
  }

  async updatePosition(results: MatchResult[]) {
    const data = results.reduce((acc, team, index, array) => {
      let position = index + 1;

      if (team.sets === array[0].sets) {
        position = 1;
      } else if (team.sets === array[index - 1].sets) {
        position = acc[index - 1].position;
      }

      return [...acc, { id: team.id, position }];
    }, []);
    const cs = new this.pgp.helpers.ColumnSet(['?id', 'position'], { table: 'match_team' });

    await this.db.none(`${this.pgp.helpers.update(data, cs)} WHERE v.id = t.id`);
  }

  async findWinnersByMatchId(matchId: number) {
    return this.db.any<MatchWinner>(sql.findWinnersByMatchId, { matchId });
  }
}
