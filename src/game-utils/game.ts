import { Game, Score, ScoreTotal, GamePlayer } from 'dart3-sdk';

export abstract class GameUtils {
  game: Game;
  player: GamePlayer;

  constructor(game: Game) {
    this.game = game;
  }

  abstract getStartTotal(): number;
  abstract getScoreTotal(scores: Score[], round: number, total: number): ScoreTotal[];

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }
}
