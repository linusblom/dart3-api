import { Game, Score, TransactionType, MatchStatus, HitScore, MetaData } from 'dart3-sdk';
import { IMain, IDatabase } from 'pg-promise';
import seedrandom from 'seedrandom';

import * as sql from '../database/sql';
import {
  LegResults,
  MatchActive,
  NextMatchTeam,
  RoundResults,
  RoundScore,
  TeamPlayerPro,
} from '../models';

export abstract class GameService {
  ColumnSet = this.pgp.helpers.ColumnSet;
  update = this.pgp.helpers.update;
  insert = this.pgp.helpers.insert;
  gems: boolean[] = [];

  constructor(public game: Game, protected db: IDatabase<any>, protected pgp: IMain) {}

  abstract getRoundScore(scores: Score[], active: MatchActive, tx): Promise<RoundScore>;
  abstract getLegResults(active: MatchActive, tx): Promise<LegResults>;
  abstract next(
    nextTeam: NextMatchTeam,
    nextRound: boolean,
    active: MatchActive,
    tx,
  ): Promise<RoundResults>;

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

  private getFractionParts(fraction: string) {
    return {
      numerator: +fraction.substr(0, fraction.indexOf('/')),
      denominator: +fraction.substr(fraction.indexOf('/') + 1),
    };
  }

  async start({ jackpotFee, nextJackpotFee, rake }: MetaData) {
    return this.db.tx(async tx => {
      const { id: gameId, team, tournament } = this.game;
      const players = await tx.any(sql.teamPlayer.findByGameIdWithPro, { gameId });

      if (tournament) {
        throw new Error('Tournament not implemented.');
      }

      if (team && (players.length % 2 !== 0 || players.length < 4)) {
        throw new Error('Incorrect player count.');
      }

      const teamPlayerIds = this.randomizeOrder(players);
      const teamData = teamPlayerIds.map(() => ({ game_id: gameId }));
      const teamCs = new this.ColumnSet(['game_id'], { table: 'team' });
      const teamIds = await tx.any(`${this.insert(teamData, teamCs)} RETURNING id`);

      const teamPlayerData = teamPlayerIds.reduce(
        (acc, ids, index) => [
          ...acc,
          ...ids.map(id => ({ id, team_id: teamIds[index].id, xp: 100 })),
        ],
        [],
      );
      const teamPlayerCs = new this.ColumnSet(['?id', 'team_id', 'xp'], { table: 'team_player' });
      await tx.none(`${this.update(teamPlayerData, teamPlayerCs)} WHERE v.id = t.id`);

      const matchIds = await tx.any(sql.match.create, {
        gameId,
        status: MatchStatus.Pending,
        stage: 1,
      });

      const matchTeamData = teamIds.map(({ id }, index) => ({
        match_id: matchIds[0].id,
        team_id: id,
        order: index + 1,
      }));
      const matchTeamCs = new this.ColumnSet(['match_id', 'team_id', 'order'], {
        table: 'match_team',
      });
      const matchTeamIds = await tx.any(`${this.insert(matchTeamData, matchTeamCs)} RETURNING id`);

      const matchTeamLegData = matchTeamIds.map(({ id }) => ({
        match_team_id: id,
        set: 1,
        leg: 1,
        score: this.game.startScore,
      }));
      const matchTeamLegCs = new this.ColumnSet(['match_team_id', 'set', 'leg', 'score'], {
        table: 'match_team_leg',
      });
      await tx.none(`${this.insert(matchTeamLegData, matchTeamLegCs)}`);

      if (rake > 0) {
        await tx.none(sql.invoice.debit, { gameId, rake: rake });
      }

      await tx.none(sql.match.start, {
        matchTeamId: matchTeamIds[0].id,
        id: matchIds[0].id,
        status: this.game.random ? MatchStatus.Playing : MatchStatus.Order,
      });
      await tx.none(sql.jackpot.increase, {
        gameId,
        fee: jackpotFee,
        nextFee: nextJackpotFee,
      });
      const game = await tx.one(sql.game.start, {
        id: gameId,
        fee: jackpotFee + nextJackpotFee + rake,
      });

      return game;
    });
  }

  async updateGems(scores: HitScore[], active: MatchActive, tx) {
    if (active.set === 1 && active.leg === 1 && active.round <= 3) {
      const rng = seedrandom();
      const { numerator, denominator } = this.getFractionParts(process.env.JACKPOT_GEM);

      this.gems = scores.map(
        score => score.value > 0 && Math.floor(rng() * denominator) < numerator,
      );

      await tx.none(sql.matchTeam.updateGems, {
        gems: this.gems.filter(gem => gem).length,
        id: active.matchTeamId,
      });
    }
  }

  async nearestBullOrder(active: MatchActive, scores: Score[], tx) {
    const matchTeams = await tx.any(sql.matchTeam.findByMatchIdWithOrder, {
      matchId: active.matchId,
    });
    const mtData = matchTeams
      .map(({ id }, index) => ({ id, ...scores[index] }))
      .sort(
        (a, b) =>
          a.bullDistance - b.bullDistance || b.score - a.score || b.multiplier - a.multiplier,
      )
      .map(({ id }, index) => ({ id, order: index + 1 }));
    const mtCs = new this.ColumnSet(['?id', 'order'], { table: 'match_team' });
    await tx.none(`${this.update(mtData, mtCs)} WHERE v.id = t.id`);

    await tx.none(sql.match.start, {
      matchTeamId: mtData[0].id,
      id: active.matchId,
      status: MatchStatus.Playing,
    });

    return this.roundResponse(active, tx);
  }

  async checkNext(active: MatchActive, tx) {
    const nextOrder = await tx.any(sql.matchTeam.findNextOrder, {
      order: active.order,
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
    });

    return nextOrder.reduce(
      (acc, team) => {
        if (acc.nextTeam) {
          return acc;
        }

        let nextRound = acc.nextRound;

        if (team.order === active.startOrder) {
          nextRound = true;
        }

        return { nextTeam: !team.position ? team : null, nextRound };
      },
      { nextTeam: null, nextRound: false },
    );
  }

  async createRound(scores: Score[]) {
    return this.db.tx(async tx => {
      const active = await tx.one(sql.match.findActiveByGameId, { gameId: this.game.id });

      if (active.status === MatchStatus.Order) {
        return this.nearestBullOrder(active, scores, tx);
      }

      const roundScore = await this.getRoundScore(scores, active, tx);

      await this.updateGems(roundScore.scores, active, tx);

      const mtData = roundScore.scores.map((score, index) => ({
        match_team_id: active.matchTeamId,
        player_id: active.playerId,
        dart: index + 1,
        round: active.round,
        leg: active.leg,
        set: active.set,
        value: score.value,
        multiplier: score.multiplier,
        approved: score.approved,
        target: score.target,
        type: score.type,
      }));
      const mtCs = new this.ColumnSet(
        [
          'match_team_id',
          'player_id',
          'dart',
          'round',
          'leg',
          'set',
          'value',
          'multiplier',
          'approved',
          'target',
          'type',
        ],
        { table: 'hit' },
      );
      await tx.none(this.insert(mtData, mtCs));

      await tx.none(sql.teamPlayer.updateXp, {
        xp: roundScore.totalScore,
        teamId: active.teamId,
        playerId: active.playerId,
      });
      await tx.none(sql.matchTeamLeg.updateScore, {
        score: roundScore.nextScore,
        matchTeamId: active.matchTeamId,
        set: active.set,
        leg: active.leg,
      });
      await tx.none(sql.match.updateActiveScore, {
        id: active.matchId,
        score: roundScore.totalScore,
      });

      const { nextTeam, nextRound } = await this.checkNext(active, tx);

      return this.next(nextTeam, nextRound, active, tx);
    });
  }

  protected async nextMatchTeam(nextTeam: NextMatchTeam, active: MatchActive, tx) {
    await tx.none(sql.match.nextMatchTeam, { matchTeamId: nextTeam.id, id: active.matchId });

    return this.roundResponse(active, tx);
  }

  async nextRound(nextTeam: NextMatchTeam, active: MatchActive, tx) {
    await tx.none(sql.match.nextRound, { matchTeamId: nextTeam.id, id: active.matchId });

    return this.roundResponse(active, tx);
  }

  protected async roundResponse(active: MatchActive, tx, game?: Game) {
    const match = await tx.one(sql.match.findByIdOnlyActive, { id: active.matchId });

    const teams = await tx.any(sql.matchTeam.findByMatchIdWithLeg, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      orderBy: 'ORDER BY d.order',
    });

    const hits = await tx.any(sql.hit.findRoundHitsBySetLegRoundAndMatchId, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      round: active.round,
    });

    return {
      ...(game && { game }),
      matches: [match],
      teams,
      hits,
      gems: this.gems,
    };
  }

  protected async nextLeg(active: MatchActive, tx) {
    const legResults = await this.getLegResults(active, tx);

    const mtlUpdateCs = new this.ColumnSet(
      [
        '?match_team_id',
        '?set',
        '?leg',
        'leg_win',
        'set_win',
        'position',
        { name: 'ended_at', mod: '^', def: 'CURRENT_TIMESTAMP' },
      ],
      { table: 'match_team_leg' },
    );
    await tx.none(
      `${this.update(
        legResults.data,
        mtlUpdateCs,
      )} WHERE v.match_team_id = t.match_team_id AND v.set = t.set AND v.leg = t.leg`,
    );

    if (legResults.endMatch) {
      return this.endMatch(active, tx);
    }

    const { leg, set } = legResults.endSet
      ? { leg: 1, set: active.set + 1 }
      : { leg: active.leg + 1, set: active.set };

    const mtlInsertData = legResults.matchTeams.map(({ id }) => ({
      match_team_id: id,
      set,
      leg,
      score: this.game.startScore,
    }));
    const mtlInsertCs = new this.ColumnSet(['match_team_id', 'set', 'leg', 'score'], {
      table: 'match_team_leg',
    });
    await tx.none(`${this.insert(mtlInsertData, mtlInsertCs)}`);

    const startOrder =
      active.startOrder + 1 > legResults.matchTeams.length ? 1 : active.startOrder + 1;

    const first = await tx.one(sql.matchTeam.findByMatchIdAndOrder, {
      matchId: active.matchId,
      order: startOrder,
    });
    await tx.none(sql.match.nextLeg, {
      matchTeamId: first.id,
      leg,
      set,
      id: active.matchId,
      startOrder,
    });

    return this.roundResponse(active, tx);
  }

  protected async endMatch(active: MatchActive, tx) {
    await tx.none(sql.match.endById, { id: active.matchId });

    const results = await tx.any(sql.matchTeam.findResults, { matchId: active.matchId });
    const mtData = results.reduce((acc, team, index, array) => {
      let position = index + 1;

      if (team.sets === array[0].sets) {
        position = 1;
      } else if (team.sets === array[index - 1].sets) {
        position = acc[index - 1].position;
      }

      return [...acc, { id: team.id, position }];
    }, []);
    const mtCs = new this.ColumnSet(['?id', 'position'], { table: 'match_team' });
    await tx.none(`${this.update(mtData, mtCs)} WHERE v.id = t.id`);

    return this.endGame(active, tx);
  }

  protected async endGame(active: MatchActive, tx) {
    const game = await tx.one(sql.game.endById, { id: this.game.id });
    const winners = await tx.any(sql.matchTeam.findWinners, { matchId: active.matchId });

    await Promise.all(
      winners
        .filter(team => team.position === 1)
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async (playerId, _, array) => {
          const win = game.prizePool / array.length;

          await tx.one(sql.transaction.credit, {
            playerId,
            description: `Winner game #${this.game.id}`,
            type: TransactionType.Win,
            amount: win,
          });

          await tx.none(sql.teamPlayer.updateWinXp, {
            win,
            xp: 1000,
            playerId,
            gameId: this.game.id,
          });

          return Promise.resolve();
        }),
    );

    await Promise.all(
      winners
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async playerId =>
          tx.none(sql.player.updateXp, { id: playerId, gameId: this.game.id }),
        ),
    );

    const teamData = winners.map(({ teamId, position }) => ({ id: teamId, position }));
    const teamCs = new this.ColumnSet(['?id', 'position'], { table: 'team' });
    await tx.none(`${this.update(teamData, teamCs)} WHERE v.id = t.id`);

    return this.roundResponse(active, tx, game);
  }
}
