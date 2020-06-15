import { Score, ScoreApproved } from 'dart3-sdk';

import { GameService } from './game';

export class HalveItService extends GameService {
  getStartScore() {
    return 0;
  }

  private checkValue(scores: Score[], valid: number) {
    return scores.map(score => ({
      ...score,
      approvedScore: valid === score.value ? this.getDartTotal(score) : 0,
    }));
  }

  private checkMultiplier(scores: Score[], valid: number) {
    return scores.map(score => ({
      ...score,
      approvedScore: valid === score.multiplier ? this.getDartTotal(score) : 0,
    }));
  }

  private checkTotal(scores: Score[], valid: number) {
    const totalValid =
      this.getRoundTotal(scores) === valid && scores.filter(({ value }) => value > 0).length === 3;

    return scores.map(score => ({
      ...score,
      approvedScore: totalValid ? this.getDartTotal(score) : 0,
    }));
  }

  private getApprovedScore(scores: Score[], round: number) {
    switch (round) {
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
        return scores.map(score => ({ ...score, approvedScore: 0 }));
    }
  }

  private getNextScore(approvedScores: ScoreApproved[], currentTotal: number) {
    const total = approvedScores.reduce((acc, { approvedScore }) => acc + approvedScore, 0);

    return total > 0 ? currentTotal + total : Math.ceil(currentTotal / 2);
  }

  getRoundScore(scores: Score[], round: number, currentScore: number) {
    const approvedScores = this.getApprovedScore(scores, round);
    const nextScore = this.getNextScore(approvedScores, currentScore);

    return {
      scores: approvedScores,
      nextScore,
      xp: this.getRoundTotal(scores),
    };
  }
}
