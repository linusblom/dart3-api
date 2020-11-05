import { Score, Check, HitType } from 'dart3-sdk';

import { GameService } from './game';
import { MatchActive, NextMatchTeam } from '../models';
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

  getHitType(check: Check, out: boolean) {
    switch (check) {
      case Check.Master:
        return out ? HitType.CheckOutMaster : HitType.CheckInMaster;
      case Check.Double:
        return out ? HitType.CheckOutDouble : HitType.CheckInDouble;
      default:
        return out ? HitType.CheckOutStraight : HitType.CheckInStraight;
    }
  }

  getApprovedCheckInScore(scores: Score[]) {
    return scores.reduce((acc, score) => {
      const dartTotal = this.getDartTotal(score);
      let approved = 0;
      let type = null;

      if (acc.reduce((t, s) => t + s.approved, 0) > 0) {
        approved = dartTotal;
      } else if (this.validMultiplier(this.game.checkIn, score.multiplier)) {
        approved = dartTotal;
        type = this.getHitType(this.game.checkIn, false);
      }

      return [...acc, { ...score, approved, type }];
    }, []);
  }

  getApprovedCheckOutScore(scores: Score[], totalScore: number) {
    let bust = false;

    return scores.reduce((acc, score, _, array) => {
      if (totalScore === 0) {
        return [...acc, { ...score, approved: 0, type: null }];
      }

      const dartTotal = this.getDartTotal(score);
      let approved = 0;
      let type = null;
      totalScore -= dartTotal;

      if (totalScore > 1) {
        approved = dartTotal;
      } else if (totalScore === 0 && this.validMultiplier(this.game.checkOut, score.multiplier)) {
        approved = dartTotal;
        type = this.getHitType(this.game.checkOut, true);
      }

      if (bust || (approved === 0 && dartTotal > 0)) {
        bust = true;
        return array.map(s => ({ ...s, approved: 0, type: null }));
      }

      return [...acc, { ...score, approved, type }];
    }, []);
  }

  async getRoundScore(scores: Score[], active: MatchActive, tx) {
    const totalScore = this.getRoundTotal(scores);
    const { score } = await tx.one(sql.matchTeamLeg.findScoreById, {
      id: active.matchTeamLegId,
    });

    let hitScores = [];
    let nextScore = 0;

    if (active.round > this.game.tieBreak) {
      hitScores = scores.map(s => ({
        ...s,
        approved: this.getDartTotal(s),
        type: HitType.TieBreak,
      }));
      nextScore = totalScore;
    } else if (score === this.game.startScore) {
      hitScores = this.getApprovedCheckInScore(scores);
      nextScore = score - hitScores.reduce((t, s) => t + s.approved, 0);
    } else {
      hitScores = scores.map(s => ({ ...s, approved: this.getDartTotal(s), type: null }));
      nextScore = score - hitScores.reduce((t, s) => t + s.approved, 0);

      if (nextScore <= 1) {
        hitScores = this.getApprovedCheckOutScore(scores, score);
        nextScore = score - hitScores.reduce((t, s) => t + s.approved, 0);
      }
    }

    return {
      totalScore,
      scores: hitScores,
      nextScore,
    };
  }

  async getLegResults(active: MatchActive, tx) {
    const matchTeams = await tx.any(sql.matchTeam.findByMatchIdWithLeg, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      orderBy:
        active.round > this.game.tieBreak
          ? 'ORDER BY d.position NULLS FIRST, d.score DESC'
          : 'ORDER BY d.score',
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

  async checkTieBreak(nextTeam: NextMatchTeam, active: MatchActive, tx) {
    const matchTeams = await tx.any(sql.matchTeam.findByMatchIdWithLeg, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      orderBy: 'ORDER BY d.position NULLS FIRST, d.score DESC',
    });

    if (matchTeams[0].score === matchTeams[1].score) {
      const beatenTeamsData = matchTeams
        .filter(({ position }) => !position)
        .map(({ id, score }, index, array) => ({
          match_team_id: id,
          set: active.set,
          leg: active.leg,
          score: 0,
          position: score !== array[0].score ? index + 1 : null,
        }))
        .filter(({ position }) => !!position);

      if (beatenTeamsData.length) {
        const beatenTeamsCs = new this.ColumnSet(
          ['?match_team_id', '?set', '?leg', 'position', 'score'],
          { table: 'match_team_leg' },
        );
        await tx.none(
          `${this.update(
            beatenTeamsData,
            beatenTeamsCs,
          )} WHERE v.match_team_id = t.match_team_id AND v.set = t.set AND v.leg = t.leg`,
        );
      }

      return this.nextRound(nextTeam, active, tx);
    }

    return this.nextLeg(active, tx);
  }

  async next(nextTeam: NextMatchTeam, nextRound: boolean, active: MatchActive, tx) {
    const { score } = await tx.one(sql.matchTeamLeg.findScoreById, {
      id: active.matchTeamLegId,
    });

    if (score === 0) {
      return this.nextLeg(active, tx);
    }

    if (!nextRound) {
      return this.nextMatchTeam(nextTeam, active, tx);
    }

    if (active.round > this.game.tieBreak) {
      return this.checkTieBreak(nextTeam, active, tx);
    }

    return this.nextRound(nextTeam, active, tx);
  }
}
