import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import pino from 'pino';
import helmet from 'koa-helmet';

import router from './routes';
import { error, logger, authError, jwt } from './middlewares';

const { PORT, CLIENT_URL } = process.env;
const app = new Koa();

app
  .use(helmet())
  .use(cors({ origin: CLIENT_URL, credentials: true }))
  .use(authError)
  .use(jwt)
  .use(logger)
  .use(error)
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT, () => pino().info(`Dart3 server is listening on ${PORT}`));
