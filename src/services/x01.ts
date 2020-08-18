import { Score, RoundScore } from 'dart3-sdk';

import { GameService } from './game';
import { MatchActive, LegResults, RoundResults } from '../models';

export class X01Service extends GameService {
  getRoundScore(scores: Score[], active: MatchActive, tx): Promise<RoundScore> {
    throw new Error('Method not implemented.');
  }
  getLegResults(active: MatchActive, tx: any): Promise<LegResults> {
    throw new Error('Method not implemented.');
  }
  next(active: MatchActive, tx: any): Promise<RoundResults> {
    throw new Error('Method not implemented.');
  }
}
