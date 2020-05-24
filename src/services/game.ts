import { Game, Score, RoundScore, TeamPlayer } from 'dart3-sdk';
import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { errorResponse, arrayRandomizer } from '../utils';

export abstract class GameService {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  abstract getStartScore(): number;
  abstract getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore;
  // abstract runLastTurn(round: number, total: number): boolean;
  // abstract lastTurn(total: number, round: number, turn: number);

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  getTeamPlayerIds(ctx: Context, players: (TeamPlayer & { seed: number })[]): number[][] {
    const { team, tournament } = this.game;

    if ((team || tournament) && (players.length % 2 !== 0 || players.length < 4)) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    if (!team) {
      return players.map(({ id }) => [id]).sort(arrayRandomizer);
    }

    const seedSortedPlayers = [
      ...players.filter(({ seed }) => seed === 1).sort(arrayRandomizer),
      ...players.filter(({ seed }) => seed === 2).sort(arrayRandomizer),
    ];

    return Array(players.length / 2)
      .fill([])
      .map(() => [seedSortedPlayers.shift().id, seedSortedPlayers.pop().id])
      .sort(arrayRandomizer);
  }
}
