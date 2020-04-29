import { GameType, Score, ScoreTotal, Game } from 'dart3-sdk';

import { GameUtils } from './game';

export class X01Utils extends GameUtils {
  getStartTotal(): number {
    switch (this.game.type) {
      case GameType.Five01DoubleInDoubleOut:
      case GameType.Five01SingleInDoubleOut:
        return 501;
      case GameType.Three01SDoubleInDoubleOut:
      case GameType.Three01SingleInDoubleOut:
        return 301;
    }
  }

  getScoreTotal(scores: Score[], round: number, total: number): ScoreTotal[] {
    throw new Error('Method not implemented.');
  }
}
