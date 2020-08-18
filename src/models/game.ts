import { MatchTeam, Game, Match, RoundHit, TeamPlayer } from 'dart3-sdk';

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
  round: number;
  set: number;
  leg: number;
  matchTeamId: number;
  playerId: number;
  teamId: number;
  matchTeamLegId: number;
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
