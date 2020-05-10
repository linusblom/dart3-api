import { Game, Score, GamePlayer, RoundScore } from 'dart3-sdk';

export abstract class GameUtils {
  game: Game;
  player: GamePlayer;

  constructor(game: Game) {
    this.game = game;
  }

  abstract getStartTotal(): number;
  abstract getRoundScore(scores: Score[], round: number, total: number): RoundScore;
  abstract runLastTurn(round: number, total: number): boolean;
  // abstract lastTurn(total: number, round: number, turn: number);

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }
}
