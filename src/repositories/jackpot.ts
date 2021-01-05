import { IDatabase, IMain, ColumnSet } from 'pg-promise';
import { Jackpot, MetaData, TransactionType } from 'dart3-sdk';

import * as sql from '../database/sql';

export class JackpotRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  async init(userId: string) {
    return this.db.one<Jackpot>(sql.jackpot.create, { userId });
  }

  async get(userId: string) {
    return this.db.one<Jackpot>(sql.jackpot.findCurrent, { userId });
  }

  async increaseByValues(userId: string, value: number, nextValue: number) {
    await this.db.none(sql.jackpot.increaseByValues, { userId, value, nextValue });
  }

  async increaseByGameId(gameId: number, meta: MetaData) {
    await this.db.none(sql.jackpot.increaseByGameId, {
      gameId,
      fee: meta.jackpotFee,
      nextFee: meta.nextJackpotFee,
    });
  }

  async winner(userId: string, gameId: number, matchTeamId: number) {
    return this.db.tx(async (tx) => {
      const team = await tx.one(sql.matchTeam.findById, { id: matchTeamId });
      const jackpot = await tx.one(sql.jackpot.findCurrent, { userId });
      const win = jackpot.value / team.playerIds.length;
      const xp = 10000 / team.playerIds.length;

      const winnersData = await Promise.all(
        team.playerIds.map(async (playerId) => {
          await tx.one(sql.transaction.credit, {
            playerId,
            description: 'JACKPOT!',
            type: TransactionType.Win,
            amount: win,
          });

          await tx.none(
            'UPDATE team_player SET win = win + $1, xp = xp + $2 WHERE player_id = $3 AND game_id = $4',
            [win, xp, playerId, gameId],
          );

          return {
            jackpot_id: jackpot.id,
            player_id: playerId,
            match_id: team.matchId,
          };
        }),
      );

      const winnerCs = new ColumnSet(['jackpot_id', 'player_id', 'match_id'], {
        table: 'jackpot_winner',
      });
      await tx.none(this.pgp.helpers.insert(winnersData, winnerCs));

      await tx.none('UPDATE match_team SET jackpot_paid = true WHERE id = $1', [team.id]);
      await tx.none('UPDATE jackpot SET won_at = current_timestamp WHERE id = $1', [jackpot.id]);
      await tx.none('INSERT INTO jackpot (user_id, value) VALUES ($1, $2)', [
        userId,
        jackpot.nextValue,
      ]);

      return { team, jackpot };
    });
  }
}
