import Router from 'koa-router';

import player from './player';
import user from './user';
import game from './game';
import jackpot from './jackpot';
import pub from './public';
import invoice from './invoice';
import { userId } from '../middlewares';

const router = new Router({ prefix: '/v1' });

router
  .use('/pub', pub.routes(), pub.allowedMethods())
  .use(userId)
  .use('/player', player.routes(), player.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods())
  .use('/game', game.routes(), game.allowedMethods())
  .use('/jackpot', jackpot.routes(), jackpot.allowedMethods())
  .use('/invoice', invoice.routes(), invoice.allowedMethods());

export default router;
