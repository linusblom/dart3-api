import { Score, RoundScore } from 'dart3-sdk';

import { GameUtils } from './game';

export class LegsUtils extends GameUtils {
  getStartTotal() {
    return 3;
  }

  getRoundScore(scores: Score[], round: number, total: number): RoundScore {
    throw new Error('Method not implemented.');
  }

  runLastTurn(_: number, __: number): boolean {
    return true;
  }

  lastTurn(total: number, round: number, turn: number) {
    throw new Error('Method not implemented.');
  }
}
