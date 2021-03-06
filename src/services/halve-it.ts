import { Score, HitScore } from 'dart3-sdk';

import { GameService } from './game';
import { NextMatchTeam } from '../models';

export class HalveItService extends GameService {
  private checkValue(scores: Score[], valid: number) {
    return scores.map((score) => ({
      ...score,
      approved: valid === score.value ? this.getDartTotal(score) : 0,
      type: null,
    }));
  }

  private checkMultiplier(scores: Score[], valid: number) {
    return scores.map((score) => ({
      ...score,
      approved: valid === score.multiplier ? this.getDartTotal(score) : 0,
      type: null,
    }));
  }

  private checkTotal(scores: Score[], valid: number) {
    const totalValid =
      this.getRoundTotal(scores) === valid && scores.filter(({ value }) => value > 0).length === 3;

    return scores.map((score) => ({
      ...score,
      approved: totalValid ? this.getDartTotal(score) : 0,
      type: null,
    }));
  }

  private getHitScore(scores: Score[]) {
    switch (this.active.round) {
      case 1:
        return this.checkValue(scores, 19);
      case 2:
        return this.checkValue(scores, 18);
      case 3:
        return this.checkMultiplier(scores, 2);
      case 4:
        return this.checkValue(scores, 17);
      case 5:
        return this.checkTotal(scores, 41);
      case 6:
        return this.checkMultiplier(scores, 3);
      case 7:
        return this.checkValue(scores, 20);
      case 8:
        return this.checkValue(scores, 25);
      default:
        return scores.map((score) => ({ ...score, approved: 0, type: null }));
    }
  }

  private getNextScore(scores: HitScore[], currentTotal: number) {
    const total = scores.reduce((acc, { approved }) => acc + approved, 0);

    return total > 0 ? currentTotal + total : Math.ceil(currentTotal / 2);
  }

  async getRoundScore(scores: Score[]) {
    const { score } = await this.tx.matchTeamLeg.findScoreById(this.active.matchTeamLegId);
    const hitScore = this.getHitScore(scores);
    const nextScore = this.getNextScore(hitScore, score);

    return {
      totalScore: this.getRoundTotal(scores),
      scores: hitScore,
      nextScore,
    };
  }

  async getLegResults() {
    const matchTeams = await this.tx.matchTeam.findByMatchIdWithLeg(this.active, ['score DESC']);
    let endMatch = false;
    let endSet = false;

    const data = matchTeams.reduce((acc, team, index, array) => {
      let legWin = false;
      let setWin = false;
      let position = index + 1;

      if (team.score === array[0].score) {
        legWin = true;
        team.legs++;
        position = 1;
      } else if (team.score === array[index - 1].score) {
        position = acc[index - 1].position;
      }

      if (team.legs > this.game.legs / 2) {
        endSet = true;
        setWin = true;
        team.sets++;
      }

      if (team.sets > this.game.sets / 2) {
        endMatch = true;
      }

      return [
        ...acc,
        {
          match_team_id: team.id,
          set: this.active.set,
          leg: this.active.leg,
          position,
          leg_win: legWin,
          set_win: setWin,
        },
      ];
    }, []);

    const matchTeamIds = matchTeams.map(({ id }) => ({ id }));

    return { data, matchTeamIds, endMatch, endSet };
  }

  async next(nextTeam: NextMatchTeam, nextRound: boolean) {
    if (nextRound && this.active.round === 8) {
      return this.nextLeg();
    } else if (nextRound) {
      return this.nextRound(nextTeam);
    }

    return this.nextMatchTeam(nextTeam);
  }
}
