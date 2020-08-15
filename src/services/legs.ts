import { Score, RoundScore } from 'dart3-sdk';

import { GameService } from './game';
import { MatchActive, LegResults, RoundResults } from '../models';

export class LegsService extends GameService {
  getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore {
    throw new Error('Method not implemented.');
  }
  getLegResults(active: MatchActive, tx: any): Promise<LegResults> {
    throw new Error('Method not implemented.');
  }
  getNextAction(active: MatchActive, tx: any): Promise<RoundResults> {
    throw new Error('Method not implemented.');
  }
}
