import { Game, Score, TransactionType, MatchStatus, HitScore, StartGame } from 'dart3-sdk';
import { ITask } from 'pg-promise';
import seedrandom from 'seedrandom';
import { Logger } from 'pino';

import { db } from '../database';
import {
  LegResults,
  MatchActive,
  NextMatchTeam,
  RoundResults,
  RoundScore,
  TeamPlayerPro,
} from '../models';
import { Extensions } from '../repositories';

export abstract class GameService {
  tx: ITask<Extensions> & Extensions;
  active: MatchActive;
  gems: boolean[] = [];

  constructor(public game: Game, protected logger: Logger) {}

  abstract getRoundScore(scores: Score[]): Promise<RoundScore>;
  abstract getLegResults(): Promise<LegResults>;
  abstract next(nextTeam: NextMatchTeam, nextRound: boolean): Promise<RoundResults>;

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  private randomizeOrder(players: TeamPlayerPro[]) {
    const rng = seedrandom();
    const arrayRandomizer = () => rng() - 0.5;

    if (!this.game.team) {
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

  async start(payload: StartGame) {
    this.game = { ...this.game, ...payload };

    return db.tx(async (tx) => {
      if (payload.tournament) {
        throw new Error('Tournament not implemented.');
      }

      const players = await tx.teamPlayer.findByGameIdWithPro(this.game.id);
      const minPlayers = (payload.tournament ? 4 : 2) * (payload.team ? 2 : 1);
      const maxPlayers = (payload.tournament ? 32 : 8) * (payload.team ? 2 : 1);

      if (
        players.length < minPlayers ||
        players.length > maxPlayers ||
        (payload.team && players.length % 2 !== 0)
      ) {
        throw new Error('Incorrect player count.');
      }

      const teamPlayerIds = this.randomizeOrder(players);
      const teamIds = await tx.team.create(teamPlayerIds, this.game.id);
      await tx.teamPlayer.updateTeamIds(teamPlayerIds, teamIds);

      const matchIds = await tx.match.create(this.game.id);
      const matchTeamIds = await tx.matchTeam.create(matchIds, teamIds);
      await tx.matchTeamLeg.create(matchTeamIds, this.game.startScore);

      const meta = await tx.userMeta.findById(this.game.userId);

      if (meta.rake > 0) {
        await tx.invoice.debit(this.game.id, meta);
      }

      const status = this.game.random ? MatchStatus.Playing : MatchStatus.Order;

      await tx.match.start(matchIds[0].id, matchTeamIds[0].id, status);
      await tx.game.start(this.game.id, payload, meta);
      await tx.jackpot.increaseByGameId(this.game.id, meta);

      this.logger.info(
        {
          gameId: this.game.id,
          uid: this.game.uid,
          jackpotFee: `${meta.currency} ${+this.game.prizePool * meta.jackpotFee}`,
          nextJackpotFee: `${meta.currency} ${+this.game.prizePool * meta.nextJackpotFee}`,
          rake: `${meta.currency} ${+this.game.prizePool * meta.rake}`,
          matchId: matchIds[0].id,
          matchStatus: status,
        },
        'Game started',
      );
    });
  }

  async createRound(scores: Score[]) {
    return db.tx(async (tx) => {
      this.active = await tx.match.findActiveByGameId(this.game.id);
      this.tx = tx;

      return this.registerScore(scores);
    });
  }

  async registerScore(scores: Score[]) {
    if (this.active.status === MatchStatus.Order) {
      return this.nearestBullOrder(scores);
    }

    const roundScore = await this.getRoundScore(scores);

    await this.tx.hit.create(this.active, roundScore.scores);
    await this.updateGems(roundScore.scores);
    await this.tx.teamPlayer.updateXp(this.active, roundScore.totalScore);
    await this.tx.matchTeamLeg.updateScore(this.active, roundScore.nextScore);

    const { nextTeam, nextRound } = await this.checkNext();

    return this.next(nextTeam, nextRound);
  }

  async updateGems(scores: HitScore[]) {
    if (this.active.set === 1 && this.active.leg === 1 && this.active.round <= 3) {
      const metaData = await this.tx.userMeta.findById(this.game.userId);
      const rng = seedrandom();

      this.gems = scores.map((score) => score.value > 0 && rng() < metaData.gemChance);

      await this.tx.matchTeam.updateGems(
        this.active.matchTeamId,
        this.gems.filter((gem) => gem).length,
      );
    }
  }

  async nearestBullOrder(scores: Score[]) {
    const matchTeams = await this.tx.matchTeam.findByMatchIdWithOrder(this.active.matchId);

    const order = matchTeams
      .map(({ id }, index) => ({ id, ...scores[index] }))
      .sort(
        (a, b) =>
          a.bullDistance - b.bullDistance || b.value - a.value || b.multiplier - a.multiplier,
      )
      .map(({ id }, index) => ({ id, order: index + 1 }));

    await this.tx.matchTeam.updateOrder(order);
    await this.tx.match.start(this.active.matchId, order[0].id, MatchStatus.Playing);

    return this.roundResponse();
  }

  async checkNext() {
    const nextOrder = await this.tx.matchTeam.findNextOrder(this.active);

    return nextOrder.reduce(
      (acc, team) => {
        if (acc.nextTeam) {
          return acc;
        }

        let nextRound = acc.nextRound;

        if (team.order === this.active.startOrder) {
          nextRound = true;
        }

        return { nextTeam: !team.position ? team : null, nextRound };
      },
      { nextTeam: null, nextRound: false },
    );
  }

  protected async nextMatchTeam(nextTeam: NextMatchTeam) {
    await this.tx.match.nextMatchTeam(this.active.matchId, nextTeam.id);

    return this.roundResponse();
  }

  async nextRound(nextTeam: NextMatchTeam) {
    await this.tx.match.nextRound(this.active.matchId, nextTeam.id);

    return this.roundResponse();
  }

  protected async roundResponse(game?: Partial<Game>) {
    const match = await this.tx.match.findByIdOnlyActive(this.active.matchId);
    const teams = await this.tx.matchTeam.findByMatchIdWithLeg(this.active, ['order']);
    const hits = await this.tx.hit.findRoundHitsBySetLegRoundAndMatchId(this.active);

    return {
      ...(game && { game }),
      matches: [match],
      teams,
      hits,
      gems: this.gems,
    };
  }

  protected async nextLeg() {
    const legResults = await this.getLegResults();

    await this.tx.matchTeamLeg.updateResults(legResults.data);

    if (legResults.endMatch) {
      return this.endMatch();
    }

    const { leg, set } = legResults.endSet
      ? { leg: 1, set: this.active.set + 1 }
      : { leg: this.active.leg + 1, set: this.active.set };

    await this.tx.matchTeamLeg.create(legResults.matchTeamIds, this.game.startScore, set, leg);

    const startOrder =
      this.active.startOrder + 1 > legResults.matchTeamIds.length ? 1 : this.active.startOrder + 1;

    const first = await this.tx.matchTeam.findByMatchIdAndOrder(this.active.matchId, startOrder);
    await this.tx.match.nextLeg(this.active.matchId, first.id, set, leg, startOrder);

    return this.roundResponse();
  }

  protected async endMatch() {
    await this.tx.match.end(this.active.matchId);

    const results = await this.tx.matchTeam.findResultsByMatchId(this.active.matchId);
    await this.tx.matchTeam.updatePosition(results);

    this.logger.info({ matchId: this.active.matchId, results }, 'Match ended');

    return this.endGame();
  }

  protected async endGame() {
    await this.tx.game.end(this.game.id);
    const results = await this.tx.matchTeam.findWinnersByMatchId(this.active.matchId);

    await Promise.all(
      results
        .filter((team) => team.position === 1)
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async (playerId, _, array) => {
          const win = +this.game.prizePool / array.length;

          await this.tx.transaction.credit(playerId, TransactionType.Win, {
            description: `Winner game #${this.game.id}`,
            amount: win,
          });
          await this.tx.teamPlayer.updateWin(this.game.id, playerId, win);

          return Promise.resolve();
        }),
    );

    await Promise.all(
      results
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async (playerId) => this.tx.player.updateXp(playerId, this.game.id)),
    );

    await this.tx.team.updatePosition(results);

    this.logger.info({ gameId: this.game.id, results }, 'Game ended');

    return this.roundResponse({ id: this.game.id, endedAt: new Date().toISOString() });
  }
}
