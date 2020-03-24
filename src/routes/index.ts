import Router from 'koa-router';

import player from './player';

export const router = new Router({ prefix: '/api/v1' });

router.use('/player', player.routes(), player.allowedMethods());
