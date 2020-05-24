import { IDatabase, IMain } from 'pg-promise';
import { MatchActive, RoundScore } from 'dart3-sdk';

import { gemRandomizer } from '../utils';

export class HitRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async createRound(active: MatchActive, roundScore: RoundScore) {
    return this.db.tx(async tx => {
      const { insert, ColumnSet } = this.pgp.helpers;

      const matchTeamData = roundScore.scores.map((score, index) => ({
        match_team_id: active.matchTeamId,
        player_id: active.playerId,
        dart: index + 1,
        round: active.round,
        leg: active.leg,
        set: active.set,
        value: score.value,
        multiplier: score.multiplier,
        approved_score: score.approvedScore,
        gem: gemRandomizer(active.round),
      }));
      const matchTeamCs = new ColumnSet(
        [
          'match_team_id',
          'player_id',
          'dart',
          'round',
          'leg',
          'set',
          'value',
          'multiplier',
          'approved_score',
          'gem',
        ],
        { table: 'hit' },
      );

      await this.db.none(insert(matchTeamData, matchTeamCs));
      await this.db.none(
        'UPDATE team_player SET xp = xp + $1 WHERE team_id = $2 AND player_id = $3',
        [roundScore.xp, active.teamId, active.playerId],
      );
      await this.db.none('UPDATE match_team SET score = $1, gems = gems + $2 WHERE id = $3', [
        roundScore.nextScore,
        matchTeamData.filter(({ gem }) => gem).length,
        active.matchTeamId,
      ]);
    });
  }
}
