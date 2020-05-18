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
  create: sql('hit/create.sql'),
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
  findByGameIdWithSeed: sql('team-player/find-by-game-id-with-seed.sql'),
  findByGameId: sql('team-player/find-by-game-id.sql'),
};

export const transaction = {
  credit: sql('transaction/credit.sql'),
  debit: sql('transaction/debit.sql'),
  findBankByUserId: sql('transaction/find-bank-by-user-id.sql'),
  findByPlayerId: sql('transaction/find-by-player-id.sql'),
};
