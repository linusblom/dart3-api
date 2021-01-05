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
  end: sql('game/end.sql'),
  create: sql('game/create.sql'),
  delete: sql('game/delete.sql'),
  findByUid: sql('game/find-by-uid.sql'),
  findCurrent: sql('game/find-current.sql'),
  start: sql('game/start.sql'),
  update: sql('game/update.sql'),
};

export const hit = {
  findRoundHitsBySetLegRoundAndMatchId: sql(
    'hit/find-round-hits-by-set-leg-round-and-match-id.sql',
  ),
  findRoundHitsByPlayingMatchAndGameId: sql('hit/find-round-hits-by-playing-match-and-game-id.sql'),
};

export const jackpot = {
  create: sql('jackpot/create.sql'),
  findCurrent: sql('jackpot/find-current.sql'),
  increaseByGameId: sql('jackpot/increase-by-game-id.sql'),
  increaseByValues: sql('jackpot/increase-by-values.sql'),
};

export const match = {
  create: sql('match/create.sql'),
  end: sql('match/end.sql'),
  findActiveByGameId: sql('match/find-active-by-game-id.sql'),
  findByGameId: sql('match/find-by-game-id.sql'),
  findById: sql('match/find-by-id.sql'),
  findByIdOnlyActive: sql('match/find-by-id-only-active.sql'),
  nextLeg: sql('match/next-leg.sql'),
  nextMatchTeam: sql('match/next-match-team.sql'),
  nextRound: sql('match/next-round.sql'),
  start: sql('match/start.sql'),
  updateActiveScore: sql('match/update-active-score.sql'),
};

export const matchTeam = {
  findByGameIdWithLeg: sql('match-team/find-by-game-id-with-leg.sql'),
  findById: sql('match-team/find-by-id.sql'),
  findNextOrder: sql('match-team/find-next-order.sql'),
  findByMatchIdWithLeg: sql('match-team/find-by-match-id-with-leg.sql'),
  findByMatchIdWithOrder: sql('match-team/find-by-match-id-with-order.sql'),
  findResultsByMatchId: sql('match-team/find-results-by-match-id.sql'),
  findWinnersByMatchId: sql('match-team/find-winners-by-match-id.sql'),
  findByMatchIdAndOrder: sql('match-team/find-by-match-id-and-order.sql'),
  updateGems: sql('match-team/update-gems.sql'),
};

export const matchTeamLeg = {
  findScoreById: sql('match-team-leg/find-score-by-id.sql'),
  findTeamsLeftCount: sql('match-team-leg/find-teams-left-count.sql'),
  updatePosition: sql('match-team-leg/update-position.sql'),
  updateScore: sql('match-team-leg/update-score.sql'),
};

export const player = {
  all: sql('player/all.sql'),
  create: sql('player/create.sql'),
  delete: sql('player/delete.sql'),
  disablePin: sql('player/disable-pin.sql'),
  findByUid: sql('player/find-by-uid.sql'),
  findIdByAdmin: sql('player/find-id-by-admin.sql'),
  findIdByPin: sql('player/find-id-by-pin.sql'),
  findIdByUid: sql('player/find-id-by-uid.sql'),
  findNameByUid: sql('player/find-name-by-uid.sql'),
  findStatisticsById: sql('player/find-statistics-by-id.sql'),
  updatePin: sql('player/update-pin.sql'),
  update: sql('player/update.sql'),
  updateXp: sql('player/update-xp.sql'),
};

export const invoice = {
  debit: sql('invoice/debit.sql'),
  findPaid: sql('invoice/find-paid.sql'),
  findUnpaid: sql('invoice/find-unpaid.sql'),
};

export const team = {
  findByGameId: sql('team/find-by-game-id.sql'),
  findById: sql('team/find-by-id.sql'),
  findResultsByGameId: sql('team/find-results-by-game-id.sql'),
};

export const teamPlayer = {
  create: sql('team-player/create.sql'),
  delete: sql('team-player/delete.sql'),
  findByGameIdWithPro: sql('team-player/find-by-game-id-with-pro.sql'),
  findByGameId: sql('team-player/find-by-game-id.sql'),
  updateWin: sql('team-player/update-win.sql'),
  updateXp: sql('team-player/update-xp.sql'),
};

export const transaction = {
  credit: sql('transaction/credit.sql'),
  debit: sql('transaction/debit.sql'),
  deletePlayer: sql('transaction/delete-player.sql'),
  findBankByUserId: sql('transaction/find-bank-by-user-id.sql'),
  findByPlayerId: sql('transaction/find-by-player-id.sql'),
};

export const userMeta = {
  create: sql('user-meta/create.sql'),
  findById: sql('user-meta/find-by-id.sql'),
  update: sql('user-meta/update.sql'),
};
