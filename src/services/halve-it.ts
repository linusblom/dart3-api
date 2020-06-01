import { Score, ScoreApproved, MatchActive } from 'dart3-sdk';
import { matchTeam as sql } from '../database/sql';

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

  getNextRoundTx(active: MatchActive) {
    return async (tx: any) => {
      const next = await tx.oneOrNone(sql.findNextTeamId, {
        matchTeamId: active.matchTeamId,
        matchId: active.id,
      });

      if (next) {
        await tx.none('UPDATE match SET active_match_team_id = $1 WHERE id = $2', [
          next.id,
          active.id,
        ]);
      } else {
        const first = await tx.oneOrNone(sql.findFirstTeamId, { matchId: active.id });

        await tx.none(
          'UPDATE match SET active_match_team_id = $1, active_round = active_round + 1 WHERE id = $2',
          [first.id, active.id],
        );
      }
    };
  }
}
