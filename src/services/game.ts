import {
  Game,
  Score,
  RoundScore,
  TransactionType,
  getStartScore,
  MatchStatus,
  ScoreApproved,
} from 'dart3-sdk';
import { IMain, IDatabase } from 'pg-promise';
import seedrandom from 'seedrandom';

import * as sql from '../database/sql';
import { LegResults, MatchActive, RoundResults, TeamPlayerPro } from '../models';

export abstract class GameService {
  gems: boolean[] = [];

  constructor(public game: Game, protected db: IDatabase<any>, protected pgp: IMain) {}

  abstract getRoundScore(scores: Score[], active: MatchActive, tx): Promise<RoundScore>;
  abstract getLegResults(active: MatchActive, tx): Promise<LegResults>;
  abstract next(active: MatchActive, tx): Promise<RoundResults>;

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  private randomizePlayers(players: TeamPlayerPro[]) {
    const arrayRandomizer = () => Math.random() - 0.5;

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

  async start() {
    return this.db.tx(async tx => {
      const { id: gameId, team, tournament, type } = this.game;
      const { ColumnSet, update, insert } = this.pgp.helpers;
      const players = await tx.any(sql.teamPlayer.findByGameIdWithPro, { gameId });

      if (tournament) {
        throw new Error('Tournament not implemented.');
      }

      if (team && (players.length % 2 !== 0 || players.length < 4)) {
        throw new Error('Incorrect player count.');
      }

      const teamPlayerIds = this.randomizePlayers(players);
      const teamData = teamPlayerIds.map(() => ({ game_id: gameId }));
      const teamCs = new ColumnSet(['game_id'], { table: 'team' });
      const teamIds = await tx.any(`${insert(teamData, teamCs)} RETURNING id`);

      const teamPlayerData = teamPlayerIds.reduce(
        (acc, ids, index) => [...acc, ...ids.map(id => ({ id, team_id: teamIds[index].id }))],
        [],
      );
      const teamPlayerCs = new ColumnSet(['?id', 'team_id'], { table: 'team_player' });
      await tx.none(`${update(teamPlayerData, teamPlayerCs)} WHERE v.id = t.id`);

      const matchIds = await tx.any(sql.match.create, {
        gameId,
        status: MatchStatus.Ready,
        stage: 1,
      });

      const matchTeamData = teamIds.map(({ id }) => ({
        match_id: matchIds[0].id,
        team_id: id,
      }));
      const matchTeamCs = new ColumnSet(['match_id', 'team_id'], {
        table: 'match_team',
      });
      const matchTeamIds = await tx.any(`${insert(matchTeamData, matchTeamCs)} RETURNING id`);

      const matchTeamLegData = matchTeamIds.map(({ id }) => ({
        match_team_id: id,
        set: 1,
        leg: 1,
        score: getStartScore(type),
      }));
      const matchTeamLegCs = new ColumnSet(['match_team_id', 'set', 'leg', 'score'], {
        table: 'match_team_leg',
      });
      await tx.none(`${insert(matchTeamLegData, matchTeamLegCs)}`);

      await tx.none(sql.match.start, { matchTeamId: matchTeamIds[0].id, id: matchIds[0].id });
      await tx.none(sql.jackpot.increase, { gameId });
      await tx.none(sql.game.start, { id: gameId });
    });
  }

  async updateGems(scores: ScoreApproved[], active: MatchActive, tx) {
    if (active.set === 1 && active.leg === 1 && active.round <= 3) {
      const rng = seedrandom();
      this.gems = scores.map(score => score.value > 0 && Math.floor(rng() * 80) < 3);

      await tx.none(sql.matchTeam.updateGems, {
        gems: this.gems.filter(gem => gem).length,
        id: active.matchTeamId,
      });
    }
  }

  async createRound(scores: Score[]) {
    return this.db.tx(async tx => {
      const { insert, ColumnSet } = this.pgp.helpers;
      const active = await tx.one(sql.match.findActiveByGameId, { gameId: this.game.id });
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
        approved_score: score.approvedScore,
      }));
      const mtCs = new ColumnSet(
        [
          'match_team_id',
          'player_id',
          'dart',
          'round',
          'leg',
          'set',
          'value',
          'multiplier',
          'approved_score',
        ],
        { table: 'hit' },
      );
      await tx.none(insert(mtData, mtCs));

      await tx.none(sql.teamPlayer.updateXp, {
        xp: roundScore.xp,
        teamId: active.teamId,
        playerId: active.playerId,
      });
      await tx.none(sql.matchTeamLeg.updateScore, {
        score: roundScore.nextScore,
        matchTeamId: active.matchTeamId,
        set: active.set,
        leg: active.leg,
      });

      return this.next(active, tx);
    });
  }

  protected async nextMatchTeam(matchTeamId: number, active: MatchActive, tx) {
    await tx.none(sql.match.nextMatchTeam, { matchTeamId, id: active.matchId });

    return this.roundResponse(active, tx);
  }

  async nextRound(active: MatchActive, tx) {
    const first = await tx.one(sql.matchTeam.findFirstTeamId, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
    });

    await tx.none(sql.match.nextRound, { matchTeamId: first.id, id: active.matchId });

    return this.roundResponse(active, tx);
  }

  protected async roundResponse(active: MatchActive, tx, game?: Game) {
    const match = await tx.one(sql.match.findByIdOnlyActive, { id: active.matchId });

    const teams = await tx.any(sql.matchTeam.findByMatchIdWithLeg, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      orderBy: '',
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
    const { ColumnSet, update, insert } = this.pgp.helpers;
    const legResults = await this.getLegResults(active, tx);

    const mtlUpdateCs = new ColumnSet(
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
      `${update(
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
      score: getStartScore(this.game.type),
    }));
    const mtlInsertCs = new ColumnSet(['match_team_id', 'set', 'leg', 'score'], {
      table: 'match_team_leg',
    });
    await tx.none(`${insert(mtlInsertData, mtlInsertCs)}`);

    const first = await tx.one(sql.matchTeam.findFirstTeamId, {
      matchId: active.matchId,
      leg,
      set,
    });

    await tx.none(sql.match.nextLeg, { matchTeamId: first.id, leg, set, id: active.matchId });

    return this.roundResponse(active, tx);
  }

  protected async endMatch(active: MatchActive, tx) {
    await tx.none(sql.match.endById, { id: active.matchId });
    const game = await tx.one(sql.game.endById, { id: this.game.id });
    const teams = await tx.any(sql.matchTeam.findResults, { matchId: active.matchId });

    await Promise.all(
      teams
        .filter((team, _, array) => team.sets === array[0].sets)
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
            xp: 10 * this.game.bet,
            playerId,
            gameId: this.game.id,
          });

          return Promise.resolve();
        }),
    );

    await Promise.all(
      teams
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async playerId =>
          tx.none(sql.player.updateXp, { id: playerId, gameId: this.game.id }),
        ),
    );

    return this.roundResponse(active, tx, game);
  }
}
