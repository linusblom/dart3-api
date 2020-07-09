import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import pino from 'pino';
import { koaJwtSecret } from 'jwks-rsa';
import jwt from 'koa-jwt';

import { router } from './routes';
import { error, logger } from './middlewares';

const { PORT, AUTH0_APP_AUDIENCE, AUTH0_APP_ISSUER } = process.env;
const app = new Koa();

app
  .use(cors({ origin: '*', credentials: true }))
  .use((ctx, next) =>
    next().catch(err => {
      if (err.status === 401) {
        ctx.status = 401;
        ctx.body = 'Unauthorized';
      } else {
        throw err;
      }
    }),
  )
  .use(
    jwt({
      secret: koaJwtSecret({
        jwksUri: `${AUTH0_APP_ISSUER}.well-known/jwks.json`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 36000000,
      }),
      algorithms: ['RS256'],
      issuer: [AUTH0_APP_ISSUER],
      audience: [AUTH0_APP_AUDIENCE],
    }).unless({ path: [/^\/api\/v1\/ping$/] }),
  )
  .use(logger)
  .use(error)
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT, () => pino().info(`Dart3 server is listening on ${PORT}`));
