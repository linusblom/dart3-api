import Router from 'koa-router';

import player from './player';
import transaction from './transaction';
import user from './user';

export const router = new Router({ prefix: '/api/v1' });

router.use('/player', player.routes(), player.allowedMethods());
router.use('/transaction', transaction.routes(), transaction.allowedMethods());
router.use('/user', user.routes(), user.allowedMethods());
