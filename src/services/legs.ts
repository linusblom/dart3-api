import { Score } from 'dart3-sdk';

import { GameService } from './game';
import { MatchActive, NextMatchTeam, RoundResults } from '../models';
import * as sql from '../database/sql';

export class LegsService extends GameService {
  async getRoundScore(scores: Score[], active: MatchActive, tx) {
    const totalScore = this.getRoundTotal(scores);
    const { score } = await tx.one(sql.matchTeamLeg.findScoreById, {
      id: active.matchTeamLegId,
    });
    await tx.none(sql.match.updateActiveScore, {
      id: active.matchId,
      score: totalScore,
    });

    if (totalScore > active.score || totalScore === 180) {
      return {
        totalScore,
        scores: scores.map(s => ({ ...s, approved: this.getDartTotal(s), type: null })),
        nextScore: score,
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
      totalScore,
      scores: scores.map(s => ({ ...s, approved: 0, type: null })),
      nextScore,
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

  async next(
    nextTeam: NextMatchTeam,
    nextRound: boolean,
    active: MatchActive,
    tx,
  ): Promise<RoundResults> {
    const { teamsLeft } = await tx.one(sql.matchTeamLeg.findTeamsLeftCount, {
      matchId: active.matchId,
      set: active.set,
      leg: active.leg,
    });

    if (teamsLeft === 1) {
      return this.nextLeg(active, tx);
    }

    if (nextRound) {
      return this.nextRound(nextTeam, active, tx);
    }

    return this.nextMatchTeam(nextTeam, active, tx);
  }
}
