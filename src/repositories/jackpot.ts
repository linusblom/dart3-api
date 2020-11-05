import { IDatabase, IMain } from 'pg-promise';
import { TransactionType } from 'dart3-sdk';

import * as sql from '../database/sql';

export class JackpotRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  init(userId: string) {
    return this.db.none('INSERT INTO jackpot (user_id) VALUES ($1)', [userId]);
  }

  get(userId: string) {
    return this.db.one(sql.jackpot.findCurrent, { userId });
  }

  winner(userId: string, gameId: number, matchTeamId: number) {
    return this.db.tx(async tx => {
      const team = await tx.one(sql.matchTeam.findById, { id: matchTeamId });
      const jackpot = await tx.one(sql.jackpot.findCurrent, { userId });
      const win = jackpot.value / team.playerIds.length;
      const xp = 10000 / team.playerIds.length;

      const winnersData = await Promise.all(
        team.playerIds.map(async playerId => {
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

      const winnerCs = new this.pgp.helpers.ColumnSet(['jackpot_id', 'player_id', 'match_id'], {
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
