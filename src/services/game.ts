import { Game, Score, RoundScore, MatchActive, TransactionType } from 'dart3-sdk';
import { IMain, IDatabase } from 'pg-promise';

import {
  hit as hSql,
  matchTeam as mtSql,
  match as mSql,
  transaction as tSql,
} from '../database/sql';
import { gemRandomizer } from '../utils';

export abstract class GameService {
  constructor(public game: Game, protected db: IDatabase<any>, protected pgp: IMain) {}

  abstract getStartScore(): number;
  abstract getRoundScore(scores: Score[], round: number, currentScore: number): RoundScore;

  protected getDartTotal(score: Score) {
    return score.value * score.multiplier;
  }

  protected getRoundTotal(scores: Score[]) {
    return scores.reduce((total, score) => total + this.getDartTotal(score), 0);
  }

  async createRound(score: Score[]) {
    return this.db.tx(async tx => {
      const { insert, ColumnSet } = this.pgp.helpers;
      const active = await tx.one(mSql.findActiveByGameId, { gameId: this.game.id });
      const roundScore = this.getRoundScore(score, active.round, active.currentScore);

      if (active.set === 1 && active.leg === 1 && active.round <= 3) {
        active.gems = roundScore.scores.map(score => score.value > 0 && gemRandomizer());

        await tx.none('UPDATE match_team SET gems = gems + $1 WHERE id = $2', [
          active.gems.filter(gem => gem).length,
          active.matchTeamId,
        ]);
      }

      const matchTeamData = roundScore.scores.map((score, index) => ({
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
      const matchTeamCs = new ColumnSet(
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
      await tx.none(insert(matchTeamData, matchTeamCs));

      await tx.none('UPDATE team_player SET xp = xp + $1 WHERE team_id = $2 AND player_id = $3', [
        roundScore.xp,
        active.teamId,
        active.playerId,
      ]);
      await tx.none(
        'UPDATE match_team_score SET score = $1 WHERE match_team_id = $2 AND set = $3 AND leg = $4',
        [roundScore.nextScore, active.matchTeamId, active.set, active.leg],
      );

      return this.next(active, tx);
    });
  }

  async next(active: MatchActive, tx) {
    const next = await tx.oneOrNone(mtSql.findNextTeamId, {
      matchTeamId: active.matchTeamId,
      matchId: active.id,
    });

    if (next) {
      return this.nextMatchTeam(next.id, active, tx);
    } else if (active.round < 8) {
      return this.nextRound(active, tx);
    } else if (active.round === 8) {
      return this.nextLeg(active, tx);
    }
  }

  protected async nextMatchTeam(matchTeamId: number, active: MatchActive, tx) {
    await tx.none('UPDATE match SET active_match_team_id = $1 WHERE id = $2', [
      matchTeamId,
      active.id,
    ]);

    return this.roundResponse(active, tx);
  }

  async nextRound(active: MatchActive, tx) {
    const first = await tx.one(mtSql.findFirstTeamId, { matchId: active.id });

    await tx.none(
      'UPDATE match SET active_match_team_id = $1, active_round = active_round + 1 WHERE id = $2',
      [first.id, active.id],
    );

    return this.roundResponse(active, tx);
  }

  protected async roundResponse(active: MatchActive, tx, game?: Game) {
    const match = await tx.one(
      `
      SELECT id, active_round, active_set, active_leg, active_match_team_id, active_player_id, status, ended_at
      FROM match_active_player_id
      WHERE id = $1
      `,
      [active.id],
    );

    const teams = await tx.any(mtSql.findByMatchIdWithScore, {
      matchId: active.id,
      set: active.set,
      leg: active.leg,
    });

    const hits = await tx.any(hSql.findRoundHitsByRoundAndTeamId, {
      matchId: active.id,
      set: active.set,
      leg: active.leg,
      round: active.round,
      matchTeamIds: [active.matchTeamId],
    });

    return {
      ...(game && { game }),
      matches: [match],
      teams,
      hits,
      gems: active.gems,
    };
  }

  protected async nextLeg(active: MatchActive, tx) {
    const { ColumnSet, update, insert } = this.pgp.helpers;
    const matchTeams = await tx.any(mtSql.findByMatchIdWithScore, {
      matchId: active.id,
      set: active.set,
      leg: active.leg,
    });

    let endMatch = false;
    let endSet = false;

    const matchTeamScoreUpdateData = matchTeams.map((team, _, array) => {
      let legWin = false;
      let setWin = false;

      if (team.score === array[0].score) {
        legWin = true;
        team.legs++;
      }

      if (team.legs > this.game.legs / 2) {
        endSet = true;
        setWin = true;
        team.sets++;
      }

      if (team.sets > this.game.sets / 2) {
        endMatch = true;
      }

      return {
        match_team_id: team.id,
        set: active.set,
        leg: active.leg,
        leg_win: legWin,
        set_win: setWin,
      };
    });

    const matchTeamScoreUpdateCs = new ColumnSet(
      [
        '?match_team_id',
        '?set',
        '?leg',
        'leg_win',
        'set_win',
        { name: 'ended_at', mod: '^', def: 'CURRENT_TIMESTAMP' },
      ],
      { table: 'match_team_score' },
    );
    await tx.none(
      `${update(
        matchTeamScoreUpdateData,
        matchTeamScoreUpdateCs,
      )} WHERE v.match_team_id = t.match_team_id AND v.set = t.set AND v.leg = t.leg`,
    );

    if (endMatch) {
      return this.endMatch(active, tx);
    }

    const { leg, set } = endSet
      ? { leg: 1, set: active.set + 1 }
      : { leg: active.leg + 1, set: active.set };

    const matchTeamScoreInsertData = matchTeams.map(({ id }) => ({
      match_team_id: id,
      set,
      leg,
      score: this.getStartScore(),
    }));
    const matchTeamScoreInsertCs = new ColumnSet(['match_team_id', 'set', 'leg', 'score'], {
      table: 'match_team_score',
    });
    await tx.none(`${insert(matchTeamScoreInsertData, matchTeamScoreInsertCs)}`);

    const first = await tx.one(mtSql.findFirstTeamId, { matchId: active.id });

    await tx.none(
      'UPDATE match SET active_match_team_id = $1, active_round = 1, active_leg = $2, active_set = $3 WHERE id = $4',
      [first.id, leg, set, active.id],
    );

    return this.roundResponse(active, tx);
  }

  protected async endMatch(active: MatchActive, tx) {
    await tx.none(
      `UPDATE match SET status = 'completed', ended_at = current_timestamp WHERE id = $1`,
      [active.id],
    );

    const game = await tx.one(
      'UPDATE game SET ended_at = current_timestamp WHERE id = $1 RETURNING id, ended_at, prize_pool',
      [this.game.id],
    );

    const teams = await tx.any(mtSql.findResults, { matchId: active.id });

    await Promise.all(
      teams
        .filter((team, _, array) => team.sets === array[0].sets)
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async (playerId, _, array) => {
          const win = game.prizePool / array.length;

          await tx.one(tSql.credit, {
            playerId,
            description: `Winner game #${this.game.id}`,
            type: TransactionType.Win,
            amount: win,
          });

          await tx.none(
            'UPDATE team_player SET win = win + $1, xp = xp + $2 WHERE player_id = $3 AND game_id = $4',
            [win, 100 * this.game.bet, playerId, this.game.id],
          );

          return Promise.resolve();
        }),
    );

    await Promise.all(
      teams
        .reduce((acc, { playerIds }) => [...acc, ...playerIds], [])
        .map(async playerId =>
          tx.none(
            'UPDATE player p SET xp = p.xp + tp.xp FROM team_player tp WHERE tp.player_id = p.id AND p.id = $1 AND tp.game_id = $2',
            [playerId, this.game.id],
          ),
        ),
    );

    return this.roundResponse(active, tx, game);
  }
}
