import Router from 'koa-router';

import player from './player';
import user from './user';
import game from './game';
import jackpot from './jackpot';
import ping from './ping';
import invoice from './invoice';
import { userId } from '../middlewares';

export const router = new Router({ prefix: '/v1' });

router
  .use('/ping', ping.routes(), ping.allowedMethods())
  .use(userId)
  .use('/player', player.routes(), player.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods())
  .use('/game', game.routes(), game.allowedMethods())
  .use('/jackpot', jackpot.routes(), jackpot.allowedMethods())
  .use('/invoice', invoice.routes(), invoice.allowedMethods());
