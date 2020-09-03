import { Score, RoundScore, Check } from 'dart3-sdk';

import { GameService } from './game';
import { MatchActive } from '../models';
import * as sql from '../database/sql';

export class X01Service extends GameService {
  validMultiplier(check: Check, multiplier: number) {
    switch (check) {
      case Check.Master:
        return multiplier >= 2;
      case Check.Double:
        return multiplier === 2;
      default:
        return true;
    }
  }

  getApprovedCheckInScore(scores: Score[]) {
    return scores.reduce((acc, score) => {
      const dartTotal = this.getDartTotal(score);
      let approvedScore = 0;

      if (acc.reduce((t, s) => t + s.approvedScore, 0) > 0) {
        approvedScore = dartTotal;
      } else {
        approvedScore = this.validMultiplier(this.game.checkIn, score.multiplier) ? dartTotal : 0;
      }

      return [...acc, { ...score, approvedScore }];
    }, []);
  }

  getApprovedCheckOutScore(scores: Score[], totalScore: number) {
    let bust = false;

    return scores.reduce((acc, score, _, array) => {
      if (totalScore === 0) {
        return [...acc, { ...score, approvedScore: 0 }];
      }

      const dartTotal = this.getDartTotal(score);
      let approvedScore = 0;
      totalScore -= dartTotal;

      if (totalScore > 1) {
        approvedScore = dartTotal;
      } else if (totalScore === 0) {
        approvedScore = this.validMultiplier(this.game.checkOut, score.multiplier) ? dartTotal : 0;
      }

      if (bust || (approvedScore === 0 && dartTotal > 0)) {
        bust = true;
        return array.map(s => ({ ...s, approvedScore: 0 }));
      }

      return [...acc, { ...score, approvedScore }];
    }, []);
  }

  async getRoundScore(scores: Score[], active: MatchActive, tx): Promise<RoundScore> {
    const totalScore = this.getRoundTotal(scores);
    const { score } = await tx.one(sql.matchTeamLeg.findScoreById, {
      id: active.matchTeamLegId,
    });

    let approvedScores = [];
    let nextScore = 0;

    if (active.round === this.game.tieBreak) {
      approvedScores = scores.map(s => ({ ...s, approvedScore: this.getDartTotal(s) }));
      nextScore = totalScore;
    } else if (score === this.game.startScore) {
      approvedScores = this.getApprovedCheckInScore(scores);
      nextScore = score - approvedScores.reduce((t, s) => t + s.approvedScore, 0);
    } else {
      approvedScores = scores.map(s => ({ ...s, approvedScore: this.getDartTotal(s) }));
      nextScore = score - approvedScores.reduce((t, s) => t + s.approvedScore, 0);

      if (nextScore <= 1) {
        approvedScores = this.getApprovedCheckOutScore(scores, score);
        nextScore = score - approvedScores.reduce((t, s) => t + s.approvedScore, 0);
      }
    }

    return {
      scores: approvedScores,
      nextScore,
      xp: totalScore,
    };
  }

  async getLegResults(active: MatchActive, tx) {
    const matchTeams = await tx.any(sql.matchTeam.findByMatchIdWithLeg, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      orderBy: `ORDER BY d.score ${active.round === this.game.tieBreak ? 'DESC' : 'ASC'}`,
    });

    let endMatch = false;
    let endSet = false;

    const data = matchTeams.map((team, index, array) => {
      let legWin = false;
      let setWin = false;
      let position = index + 1;

      if (team.score === array[0].score) {
        legWin = true;
        team.legs++;
        position = 1;
      }

      if (team.legs > this.game.legs / 2) {
        endSet = true;
        setWin = true;
        team.sets++;
      }

      if (team.sets > this.game.sets / 2) {
        endMatch = true;
      }

      return {
        match_team_id: team.id,
        set: active.set,
        leg: active.leg,
        position,
        leg_win: legWin,
        set_win: setWin,
      };
    }, []);

    return { data, matchTeams, endMatch, endSet };
  }

  async next(active: MatchActive, tx) {
    const { score } = await tx.one(sql.matchTeamLeg.findScoreById, {
      id: active.matchTeamLegId,
    });

    if (score === 0) {
      return this.nextLeg(active, tx);
    }

    const next = await tx.oneOrNone(sql.matchTeam.findNextTeamId, {
      matchTeamId: active.matchTeamId,
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
    });

    if (next) {
      return this.nextMatchTeam(next.id, active, tx);
    } else if (active.round === this.game.tieBreak) {
      return this.nextLeg(active, tx);
    } else {
      return this.nextRound(active, tx);
    }
  }
}
