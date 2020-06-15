import { Game, Score, RoundScore, MatchActive } from 'dart3-sdk';
import { IMain, IDatabase } from 'pg-promise';

import { hit as hSql, matchTeam as mtSql, match as mSql } from '../database/sql';
import { gemRandomizer } from '../utils';

export abstract class GameService {
  constructor(public game: Game, protected db: IDatabase<any>, protected pgp: IMain) {}

  abstract getStartScore(): number;
  abstract getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore;

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  async createRound(score: Score[]) {
    return this.db.tx(async tx => {
      const { insert, ColumnSet } = this.pgp.helpers;
      const active = await tx.one(mSql.findActiveByGameId, { gameId: this.game.id });
      const roundScore = this.getRoundScore(score, active.round, active.currentScore);

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

      await tx.none(insert(matchTeamData, matchTeamCs));
      await tx.none('UPDATE team_player SET xp = xp + $1 WHERE team_id = $2 AND player_id = $3', [
        roundScore.xp,
        active.teamId,
        active.playerId,
      ]);
      await tx.none('UPDATE match_team SET score = $1, gems = gems + $2 WHERE id = $3', [
        roundScore.nextScore,
        matchTeamData.filter(({ gem }) => gem).length,
        active.matchTeamId,
      ]);

      return this.next(active, tx);
    });
  }

  async next(active: MatchActive, tx) {
    const next = await tx.oneOrNone(mtSql.findNextTeamId, {
      matchTeamId: active.matchTeamId,
      matchId: active.id,
    });

    if (next) {
      return this.nextMatchTeam(next.id, active, tx);
    } else if (active.round < 8) {
      return this.nextRound(active, tx);
    } else if (active.round === 8) {
      return this.nextLeg(active, tx);
    }
  }

  async nextMatchTeam(matchTeamId: number, active: MatchActive, tx) {
    await tx.none('UPDATE match SET active_match_team_id = $1 WHERE id = $2', [
      matchTeamId,
      active.id,
    ]);

    return this.nextRoundResponse(active, matchTeamId, active.round, tx);
  }

  async nextRound(active: MatchActive, tx) {
    const first = await tx.one(mtSql.findFirstTeamId, { matchId: active.id });

    await tx.none(
      'UPDATE match SET active_match_team_id = $1, active_round = active_round + 1 WHERE id = $2',
      [first.id, active.id],
    );

    return this.nextRoundResponse(active, first.id, active.round + 1, tx);
  }

  protected async nextRoundResponse(
    active: MatchActive,
    activeMatchTeamId: number,
    activeRound: number,
    tx,
  ) {
    const team = await tx.one('SELECT id, score, gems FROM match_team WHERE id = $1', [
      active.matchTeamId,
    ]);
    const hits = await tx.any(hSql.findRoundHitsByRoundAndTeamId, {
      matchId: active.id,
      activeSet: active.set,
      activeLeg: active.leg,
      activeRound: active.round,
      matchTeamIds: [active.matchTeamId],
    });

    return {
      matches: [{ id: active.id, activeMatchTeamId, activeRound }],
      teams: [team],
      hits,
    };
  }

  async nextLeg(active: MatchActive, tx) {
    const { ColumnSet, update } = this.pgp.helpers;
    const matchTeams = await tx.any(
      'SELECT id, legs, sets, score FROM match_team WHERE match_id = $1 ORDER BY score DESC',
      [active.id],
    );

    let endMatch = false;
    let endSet = false;

    const matchTeamData = matchTeams
      .reduce((acc, team, _, array) => {
        if (team.score === array[0].score) {
          team.legs++;
        }

        if (team.legs > this.game.legs / 2) {
          endSet = true;
          team.sets++;
        }

        if (team.sets > this.game.sets / 2) {
          endMatch = true;
        }

        return [...acc, { ...team, score: 0, gems: 0 }];
      }, [])
      .map(team => ({ ...team, legs: endSet ? 0 : team.legs }));

    const matchTeamPlayerCs = new ColumnSet(['?id', 'legs', 'sets', 'score', 'gems'], {
      table: 'match_team',
    });
    await tx.none(`${update(matchTeamData, matchTeamPlayerCs)} WHERE v.id = t.id`);

    const first = await tx.one(mtSql.findFirstTeamId, { matchId: active.id });
    const { leg, set } = endSet
      ? { leg: 1, set: active.set + 1 }
      : { leg: active.leg + 1, set: active.set };

    const nextActive = await tx.one(
      `
      UPDATE match SET active_match_team_id = $1, active_round = 1, active_leg = $2, active_set = $3 WHERE id = $4
      RETURNING active_match_team_id, active_round, active_leg, active_set
      `,
      [first.id, leg, set, active.id],
    );

    if (endMatch) {
      return this.endMatch(active, tx);
    }

    const teams = await tx.any(
      'SELECT id, score, legs, sets, gems FROM match_team WHERE match_id = $1',
      [active.id],
    );

    return {
      matches: [{ id: active.id, ...nextActive }],
      teams,
      hits: [],
    };
  }

  async endMatch(active: MatchActive, tx) {
    const match = await tx.one(
      `UPDATE match SET status = 'completed', ended_at = current_timestamp WHERE id = $1 RETURNING id, status, ended_at`,
      [active.id],
    );

    const game = await tx.one(
      'UPDATE game SET ended_at = current_timestamp WHERE id = $1 RETURNING id, ended_at, bet',
      [this.game.id],
    );

    const teams = await tx.any(
      'SELECT id, score, legs, sets, gems, team_id FROM match_team WHERE match_id = $1 ORDER BY sets DESC',
      [active.id],
    );

    const winners = teams.filter((team, _, array) => team.sets === array[0].sets);

    console.log(winners);

    return {
      game,
      teams,
      matches: [match],
      hits: [],
    };
  }
}
