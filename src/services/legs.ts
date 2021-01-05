import { Score } from 'dart3-sdk';

import { GameService } from './game';
import { NextMatchTeam, RoundResults } from '../models';

export class LegsService extends GameService {
  async getRoundScore(scores: Score[]) {
    const totalScore = this.getRoundTotal(scores);
    const { score } = await this.tx.matchTeamLeg.findScoreById(this.active.matchTeamLegId);

    await this.tx.match.updateActiveScore(this.active.matchId, totalScore);

    if (totalScore > this.active.score || totalScore === 180) {
      return {
        totalScore,
        scores: scores.map((s) => ({ ...s, approved: this.getDartTotal(s), type: null })),
        nextScore: score,
      };
    }

    const nextScore = score - 1;

    if (nextScore === 0) {
      await this.tx.matchTeamLeg.updatePosition(this.active);
    }

    return {
      totalScore,
      scores: scores.map((s) => ({ ...s, approved: 0, type: null })),
      nextScore,
    };
  }

  async getLegResults() {
    const matchTeams = await this.tx.matchTeam.findByMatchIdWithLeg(this.active, [
      'position NULLS FIRST',
    ]);
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
        set: this.active.set,
        leg: this.active.leg,
        position: index + 1,
        leg_win: legWin,
        set_win: setWin,
      };
    });

    const matchTeamIds = matchTeams.map(({ id }) => ({ id }));

    return { data, matchTeamIds, endMatch, endSet };
  }

  async next(nextTeam: NextMatchTeam, nextRound: boolean): Promise<RoundResults> {
    const { teamsLeft } = await this.tx.matchTeamLeg.findTeamsLeftCount(this.active);

    if (teamsLeft === 1) {
      return this.nextLeg();
    } else if (nextRound) {
      return this.nextRound(nextTeam);
    }

    return this.nextMatchTeam(nextTeam);
  }
}
