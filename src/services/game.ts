import { Game, Score, RoundScore, TeamPlayer, MatchActive } from 'dart3-sdk';
import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { errorResponse, arrayRandomizer } from '../utils';
import { TxFn } from '../models';

export abstract class GameService {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  abstract getStartScore(): number;
  abstract getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore;
  abstract getNextRoundTx(active: MatchActive): TxFn;

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  getTeamPlayerIds(ctx: Context, players: (TeamPlayer & { pro: boolean })[]): number[][] {
    const { team, tournament } = this.game;

    if ((team || tournament) && (players.length % 2 !== 0 || players.length < 4)) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }

    if (!team) {
      return players.map(({ id }) => [id]).sort(arrayRandomizer);
    }

    const proSortedPlayers = [
      ...players.filter(({ pro }) => pro).sort(arrayRandomizer),
      ...players.filter(({ pro }) => !pro).sort(arrayRandomizer),
    ];

    return Array(players.length / 2)
      .fill([])
      .map(() => [proSortedPlayers.shift().id, proSortedPlayers.pop().id])
      .sort(arrayRandomizer);
  }
}
