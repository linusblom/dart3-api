import { Score, RoundScore } from 'dart3-sdk';

import { GameService } from './game';

export class LegsService extends GameService {
  getStartScore() {
    return 3;
  }

  getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore {
    throw new Error('Method not implemented.');
  }

  // runLastTurn(_: number, __: number): boolean {
  //   return true;
  // }

  // lastTurn(total: number, round: number, turn: number) {
  //   throw new Error('Method not implemented.');
  // }
}
