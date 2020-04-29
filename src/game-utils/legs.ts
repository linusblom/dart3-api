import { Score, ScoreTotal, Game } from 'dart3-sdk';

import { GameUtils } from './game';

export class LegsUtils extends GameUtils {
  getStartTotal(): number {
    return 3;
  }

  getScoreTotal(scores: Score[], round: number, total: number): ScoreTotal[] {
    throw new Error('Method not implemented.');
  }
}
