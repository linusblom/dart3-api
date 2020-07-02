import { Score, RoundScore, MatchActive } from 'dart3-sdk';

import { GameService } from './game';

export class LegsService extends GameService {
  getStartScore() {
    return 3;
  }

  getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore {
    throw new Error('Method not implemented.');
  }

  getNextRoundTx(active: MatchActive) {
    return () => {};
  }
}
