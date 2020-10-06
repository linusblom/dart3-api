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

interface Extensions {
  player: PlayerRepository;
  transaction: TransactionRepository;
  game: GameRepository;
  hit: HitRepository;
  team: TeamRepository;
  teamPlayer: TeamPlayerRepository;
  match: MatchRepository;
  matchTeam: MatchTeamRepository;
  jackpot: JackpotRepository;
  invoice: InvoiceRepository;
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
  JackpotRepository,
  InvoiceRepository,
};
