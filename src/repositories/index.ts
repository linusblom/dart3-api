import { PlayerRepository } from './player';
import { TransactionRepository } from './transaction';
import { GameRepository } from './game';
import { HitRepository } from './hit';
import { TeamRepository } from './team';
import { TeamPlayerRepository } from './team-player';

interface Extensions {
  player: PlayerRepository;
  transaction: TransactionRepository;
  game: GameRepository;
  hit: HitRepository;
  team: TeamRepository;
  teamPlayer: TeamPlayerRepository;
}

export {
  Extensions,
  PlayerRepository,
  TransactionRepository,
  GameRepository,
  HitRepository,
  TeamRepository,
  TeamPlayerRepository,
};
