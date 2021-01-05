import { Score, Check, HitType } from 'dart3-sdk';

import { GameService } from './game';
import { NextMatchTeam } from '../models';

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
        return array.map((s) => ({ ...s, approved: 0, type: null }));
      }

      return [...acc, { ...score, approved, type }];
    }, []);
  }

  async getRoundScore(scores: Score[]) {
    const totalScore = this.getRoundTotal(scores);
    const { score } = await this.tx.matchTeamLeg.findScoreById(this.active.matchTeamLegId);

    let hitScores = [];
    let nextScore = 0;

    if (this.active.round > this.game.tieBreak) {
      hitScores = scores.map((s) => ({
        ...s,
        approved: this.getDartTotal(s),
        type: HitType.TieBreak,
      }));
      nextScore = totalScore;
    } else if (score === this.game.startScore) {
      hitScores = this.getApprovedCheckInScore(scores);
      nextScore = score - hitScores.reduce((t, s) => t + s.approved, 0);
    } else {
      hitScores = scores.map((s) => ({ ...s, approved: this.getDartTotal(s), type: null }));
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

  async getLegResults() {
    const matchTeams = await this.tx.matchTeam.findByMatchIdWithLeg(
      this.active,
      this.active.round > this.game.tieBreak ? ['position NULLS FIRST', 'score DESC'] : ['score'],
    );

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
        set: this.active.set,
        leg: this.active.leg,
        position,
        leg_win: legWin,
        set_win: setWin,
      };
    }, []);

    const matchTeamIds = matchTeams.map(({ id }) => ({ id }));

    return { data, matchTeamIds, endMatch, endSet };
  }

  async checkTieBreak(nextTeam: NextMatchTeam) {
    const matchTeams = await this.tx.matchTeam.findByMatchIdWithLeg(this.active, [
      'position NULLS FIRST',
      'score DESC',
    ]);

    if (matchTeams[0].score === matchTeams[1].score) {
      await this.tx.matchTeamLeg.updateBeatenTeams(this.active, matchTeams);

      return this.nextRound(nextTeam);
    }

    return this.nextLeg();
  }

  async next(nextTeam: NextMatchTeam, nextRound: boolean) {
    const { score } = await this.tx.matchTeamLeg.findScoreById(this.active.matchTeamLegId);

    if (score === 0) {
      return this.nextLeg();
    } else if (!nextRound) {
      return this.nextMatchTeam(nextTeam);
    } else if (this.active.round > this.game.tieBreak) {
      return this.checkTieBreak(nextTeam);
    }

    return this.nextRound(nextTeam);
  }
}
