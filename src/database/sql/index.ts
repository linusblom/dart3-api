import { QueryFile, IQueryFileOptions } from 'pg-promise';
import path from 'path';

function sql(file: string): QueryFile {
  const fullPath: string = path.join(__dirname, file);
  const options: IQueryFileOptions = { minify: true };
  const qf: QueryFile = new QueryFile(fullPath, options);

  if (qf.error) {
    console.error(qf.error);
  }

  return qf;
}

export const game = {
  create: sql('game/create.sql'),
  delete: sql('game/delete.sql'),
  findById: sql('game/find-by-id.sql'),
  findCurrent: sql('game/find-current.sql'),
};

export const hit = {
  findRoundHitsByRounds: sql('hit/find-round-hits-by-rounds.sql'),
  findRoundHitsByTeamIds: sql('hit/find-round-hits-by-team-ids.sql'),
};

export const match = {
  findActiveByGameId: sql('match/find-active-by-game-id.sql'),
  findByGameId: sql('match/find-by-game-id.sql'),
  findById: sql('match/find-by-id.sql'),
};

export const matchTeam = {
  findByGameId: sql('match-team/find-by-game-id.sql'),
  findById: sql('match-team/find-by-id.sql'),
  findFirstTeamId: sql('match-team/find-first-team-id.sql'),
  findNextTeamId: sql('match-team/find-next-team-id.sql'),
};

export const player = {
  all: sql('player/all.sql'),
  create: sql('player/create.sql'),
  delete: sql('player/delete.sql'),
  findById: sql('player/find-by-id.sql'),
  findByPin: sql('player/find-by-pin.sql'),
  updatePin: sql('player/update-pin.sql'),
  update: sql('player/update.sql'),
};

export const team = {
  findByGameId: sql('team/find-by-game-id.sql'),
  findById: sql('team/find-by-id.sql'),
};

export const teamPlayer = {
  create: sql('team-player/create.sql'),
  delete: sql('team-player/delete.sql'),
  findByGameIdWithPro: sql('team-player/find-by-game-id-with-pro.sql'),
  findByGameId: sql('team-player/find-by-game-id.sql'),
};

export const transaction = {
  credit: sql('transaction/credit.sql'),
  debit: sql('transaction/debit.sql'),
  findBankByUserId: sql('transaction/find-bank-by-user-id.sql'),
  findByPlayerId: sql('transaction/find-by-player-id.sql'),
};
