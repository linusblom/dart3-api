import { MatchTeam, Game, Match, RoundHit, TeamPlayer, MatchStatus, HitScore } from 'dart3-sdk';

export interface LegResults {
  data: LegData[];
  matchTeams: MatchTeam[];
  endMatch: boolean;
  endSet: boolean;
}

export interface LegData {
  match_team_id: number;
  set: number;
  leg: number;
  position: number;
  leg_win: boolean;
  set_win: boolean;
}

export interface MatchActive {
  matchId: number;
  status: MatchStatus;
  round: number;
  set: number;
  leg: number;
  matchTeamId: number;
  playerId: number;
  teamId: number;
  matchTeamLegId: number;
  order: number;
  startOrder: number;
  score: number;
}

export interface RoundScore {
  totalScore: number;
  scores: HitScore[];
  nextScore: number;
}

export interface RoundResults {
  game?: Partial<Game>;
  matches: Partial<Match>[];
  teams: Partial<MatchTeam>[];
  hits: RoundHit[];
  gems: boolean[];
}

export interface TeamPlayerPro extends TeamPlayer {
  pro: boolean;
}

export interface NextMatchTeam {
  id: number;
  order: number;
  position: number;
}
