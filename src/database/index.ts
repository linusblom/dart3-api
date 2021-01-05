import promise from 'bluebird';
import pgPromise, { IInitOptions, IDatabase, IMain } from 'pg-promise';
import humps from 'humps';

import {
  Extensions,
  PlayerRepository,
  GameRepository,
  TransactionRepository,
  HitRepository,
  TeamRepository,
  TeamPlayerRepository,
  MatchRepository,
  MatchTeamRepository,
  MatchTeamLegRepository,
  JackpotRepository,
  InvoiceRepository,
  UserMetaRepository,
} from '../repositories';

type ExtendedProtocol = IDatabase<Extensions> & Extensions;

function camelizeColumnNames(data: any) {
  var template = data[0];
  for (var prop in template) {
    var camel = humps.camelize(prop);
    if (!(camel in template)) {
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        d[camel] = d[prop];
        delete d[prop];
      }
    }
  }
}

const initOptions: IInitOptions<Extensions> = {
  promiseLib: promise,
  capSQL: true,
  extend(obj: ExtendedProtocol, dc: any) {
    obj.player = new PlayerRepository(obj, pgp);
    obj.transaction = new TransactionRepository(obj, pgp);
    obj.game = new GameRepository(obj, pgp);
    obj.hit = new HitRepository(obj, pgp);
    obj.team = new TeamRepository(obj, pgp);
    obj.teamPlayer = new TeamPlayerRepository(obj, pgp);
    obj.match = new MatchRepository(obj, pgp);
    obj.matchTeam = new MatchTeamRepository(obj, pgp);
    obj.jackpot = new JackpotRepository(obj, pgp);
    obj.invoice = new InvoiceRepository(obj, pgp);
    obj.userMeta = new UserMetaRepository(obj, pgp);
    obj.matchTeamLeg = new MatchTeamLegRepository(obj, pgp);
  },
  receive: function (data) {
    camelizeColumnNames(data);
  },
};

const pgp: IMain = pgPromise(initOptions);
const db: ExtendedProtocol = pgp({ connectionString: process.env.DATABASE_URL, max: 30 });
pgp.pg.types.setTypeParser(20, parseInt);

export { db, pgp };
