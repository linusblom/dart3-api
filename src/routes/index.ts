import Router from 'koa-router';

import player from './player';
import user from './user';
import game from './game';

export const router = new Router({ prefix: '/api/v1' });

router
  .use('/player', player.routes(), player.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods())
  .use('/game', game.routes(), game.allowedMethods());
