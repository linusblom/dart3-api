import { Score, ScoreTotal, RoundScore, GamePlayer } from 'dart3-sdk';

import { GameUtils } from './game';

export class HalveItUtils extends GameUtils {
  getStartTotal() {
    return 0;
  }

  private checkValue(scores: Score[], valid: number) {
    return scores.map(score => ({
      ...score,
      total: valid === score.value ? this.getDartTotal(score) : 0,
    }));
  }

  private checkMultiplier(scores: Score[], valid: number) {
    return scores.map(score => ({
      ...score,
      total: valid === score.multiplier ? this.getDartTotal(score) : 0,
    }));
  }

  private checkTotal(scores: Score[], valid: number) {
    const totalValid =
      this.getRoundTotal(scores) === valid && scores.filter(({ value }) => value > 0).length === 3;

    return scores.map(score => ({ ...score, total: totalValid ? this.getDartTotal(score) : 0 }));
  }

  private getScoreTotal(scores: Score[], round: number) {
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
        return scores.map(score => ({ ...score, total: 0 }));
    }
  }

  private getTotal(scores: ScoreTotal[], currentTotal: number) {
    const total = scores.reduce((acc, { total }) => acc + total, 0);

    return total > 0 ? currentTotal + total : Math.ceil(currentTotal / 2);
  }

  getRoundScore(scores: Score[], round: number, currentTotal: number) {
    const scoreTotals = this.getScoreTotal(scores, round);
    const total = this.getTotal(scoreTotals, currentTotal);

    return {
      scores: scoreTotals,
      total,
      xp: this.getRoundTotal(scores),
    };
  }

  runLastTurn(round: number, _: number) {
    return round === 8;
  }

  lastTurn(players: GamePlayer[], round: number) {
    if (round !== 8) {
      return null;
    }
  }
}
