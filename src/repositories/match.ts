import { IDatabase, IMain } from 'pg-promise';
import { DbId, Match, MatchStatus } from 'dart3-sdk';

import { match as sql } from '../database/sql';
import { MatchActive } from '../models';

export class MatchRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findById(id: number) {
    return this.db.one<Match>(sql.findById, { id });
  }

  async findByGameId(gameId: number) {
    return this.db.any<Match>(sql.findByGameId, { gameId });
  }

  async create(gameId: number) {
    return await this.db.any<DbId>(sql.create, { gameId, status: MatchStatus.Pending, stage: 1 });
  }

  async start(id: number, matchTeamId: number, random = false) {
    const status = random ? MatchStatus.Playing : MatchStatus.Order;

    await this.db.none(sql.start, { matchTeamId, id, status });
  }

  async findActiveByGameId(gameId: number) {
    return this.db.one<MatchActive>(sql.findActiveByGameId, { gameId });
  }

  async nextMatchTeam(id: number, matchTeamId: number) {
    await this.db.none(sql.nextMatchTeam, { id, matchTeamId });
  }

  async nextRound(id: number, matchTeamId: number) {
    await this.db.none(sql.nextRound, { id, matchTeamId });
  }

  async findByIdOnlyActive(id: number) {
    return this.db.one<Partial<Match>>(sql.findByIdOnlyActive, { id });
  }

  async nextLeg(id: number, matchTeamId: number, set: number, leg: number, startOrder: number) {
    await this.db.none(sql.nextLeg, { id, matchTeamId, set, leg, startOrder });
  }

  async end(id: number) {
    await this.db.none(sql.end, { id });
  }

  async updateActiveScore(id: number, score: number) {
    await this.db.none(sql.updateActiveScore, { id, score });
  }
}
