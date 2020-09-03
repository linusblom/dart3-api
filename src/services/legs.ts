import { Score } from 'dart3-sdk';

import { GameService } from './game';
import { MatchActive, RoundResults } from '../models';
import * as sql from '../database/sql';

export class LegsService extends GameService {
  async getRoundScore(scores: Score[], active: MatchActive, tx) {
    const totalScore = this.getRoundTotal(scores);
    const { score } = await tx.one(sql.matchTeamLeg.findScoreById, {
      id: active.matchTeamLegId,
    });
    const prevTeam = await tx.oneOrNone(sql.hit.findByPreviousMatchTeam, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      round: active.round,
      matchTeamId: active.matchTeamId,
    });

    if (!prevTeam || totalScore > prevTeam.score || totalScore === 180) {
      return {
        scores: scores.map(s => ({ ...s, approvedScore: this.getDartTotal(s) })),
        nextScore: score,
        xp: totalScore,
      };
    }

    const nextScore = score - 1;

    if (nextScore === 0) {
      await tx.none(sql.matchTeamLeg.setPosition, {
        matchId: active.matchId,
        set: active.set,
        leg: active.leg,
        matchTeamId: active.matchTeamId,
      });
    }

    return {
      scores: scores.map(s => ({ ...s, approvedScore: 0 })),
      nextScore,
      xp: totalScore,
    };
  }

  async getLegResults(active: MatchActive, tx) {
    const matchTeams = await tx.any(sql.matchTeam.findByMatchIdWithLeg, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
      orderBy: 'ORDER BY d.position NULLS FIRST',
    });

    let endMatch = false;
    let endSet = false;

    const data = matchTeams.map((team, index) => {
      let legWin = false;
      let setWin = false;

      if (index === 0) {
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
        position: index + 1,
        leg_win: legWin,
        set_win: setWin,
      };
    });

    return { data, matchTeams, endMatch, endSet };
  }

  async next(active: MatchActive, tx): Promise<RoundResults> {
    const { teamsLeft } = await tx.one(sql.matchTeamLeg.findTeamsLeftCount, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
    });

    if (teamsLeft === 1) {
      return this.nextLeg(active, tx);
    }

    const next = await tx.oneOrNone(sql.matchTeam.findNextTeamId, {
      matchTeamId: active.matchTeamId,
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
    });

    if (next) {
      return this.nextMatchTeam(next.id, active, tx);
    } else {
      return this.nextRound(active, tx);
    }
  }
}
