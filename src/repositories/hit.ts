import { IDatabase, IMain } from 'pg-promise';
import { HitScore, RoundHit } from 'dart3-sdk';

import { hit as sql } from '../database/sql';
import { MatchActive } from '../models';

export class HitRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async findRoundHitsByPlayingMatchAndGameId(gameId: number) {
    return this.db.any<RoundHit>(sql.findRoundHitsByPlayingMatchAndGameId, { gameId });
  }

  async findRoundHitsBySetLegRoundAndMatchId({ matchId, set, leg, round }: MatchActive) {
    return this.db.any<RoundHit>(sql.findRoundHitsBySetLegRoundAndMatchId, {
      matchId,
      set,
      leg,
      round,
    });
  }

  async create({ matchTeamId, playerId, round, set, leg }: MatchActive, scores: HitScore[]) {
    const data = scores.map((score, index) => ({
      match_team_id: matchTeamId,
      player_id: playerId,
      dart: index + 1,
      round,
      leg,
      set,
      value: score.value,
      multiplier: score.multiplier,
      approved: score.approved,
      target: score.target,
      type: score.type,
    }));

    const cs = new this.pgp.helpers.ColumnSet(
      [
        'match_team_id',
        'player_id',
        'dart',
        'round',
        'leg',
        'set',
        'value',
        'multiplier',
        'approved',
        'target',
        'type',
      ],
      { table: 'hit' },
    );

    await this.db.none(this.pgp.helpers.insert(data, cs));
  }
}
