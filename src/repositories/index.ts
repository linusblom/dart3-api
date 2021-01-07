import { PlayerRepository } from './player';
import { TransactionRepository } from './transaction';
import { GameRepository } from './game';
import { HitRepository } from './hit';
import { TeamRepository } from './team';
import { TeamPlayerRepository } from './team-player';
import { MatchRepository } from './match';
import { MatchTeamRepository } from './match-team';
import { JackpotRepository } from './jackpot';
import { InvoiceRepository } from './invoice';
import { UserMetaRepository } from './user-meta';
import { MatchTeamLegRepository } from './match-team-leg';

interface Extensions {
  player: PlayerRepository;
  transaction: TransactionRepository;
  game: GameRepository;
  hit: HitRepository;
  team: TeamRepository;
  teamPlayer: TeamPlayerRepository;
  match: MatchRepository;
  matchTeam: MatchTeamRepository;
  matchTeamLeg: MatchTeamLegRepository;
  jackpot: JackpotRepository;
  invoice: InvoiceRepository;
  userMeta: UserMetaRepository;
}

export {
  Extensions,
  PlayerRepository,
  TransactionRepository,
  GameRepository,
  HitRepository,
  TeamRepository,
  TeamPlayerRepository,
  MatchRepository,
  MatchTeamRepository,
  MatchTeamLegRepository,
  JackpotRepository,
  InvoiceRepository,
  UserMetaRepository,
};
