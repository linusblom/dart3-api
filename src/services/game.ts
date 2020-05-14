import { Game, Score, RoundScore, TeamPlayer, GameMode, TeamSize, Team } from 'dart3-sdk';
import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { errorResponse, arrayRandomizer } from '../utils';

export abstract class GameService {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  abstract getStartTotal(): number;
  abstract getRoundScore(scores: Score[], round: number, total: number): RoundScore;
  // abstract runLastTurn(round: number, total: number): boolean;
  // abstract lastTurn(total: number, round: number, turn: number);

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  getTeamPlayerIds(ctx: Context, players: (TeamPlayer & { seed: number })[]): number[][] {
    const { teamSize, mode } = this.game;

    if (
      (teamSize === TeamSize.Two || mode === GameMode.Tournament) &&
      (players.length % 2 !== 0 || players.length < 4)
    ) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    if (teamSize === TeamSize.One) {
      return players.map(({ id }) => [id]).sort(arrayRandomizer);
    }

    const seedSortedPlayers = [
      ...players.filter(({ seed }) => seed === 1).sort(arrayRandomizer),
      ...players.filter(({ seed }) => seed === 2).sort(arrayRandomizer),
    ];

    return Array(players.length / teamSize)
      .fill([])
      .map(() => [seedSortedPlayers.shift().id, seedSortedPlayers.pop().id])
      .sort(arrayRandomizer);
  }
}
