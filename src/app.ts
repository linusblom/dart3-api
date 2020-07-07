import Koa from 'koa';
import cors from '@koa/cors';
import dotenv from 'dotenv';
import bodyParser from 'koa-bodyparser';
import pino from 'pino';

dotenv.config();

import { router } from './routes';
import { error, authorize, logger } from './middlewares';

const { PORT } = process.env;
const app = new Koa();

app
  .use(cors({ origin: '*', credentials: true }))
  .use(logger)
  .use(error)
  .use(authorize)
  .use(bodyParser())
  .use(router.routes())

  .use(router.allowedMethods());

app.listen(PORT, () =>
  pino().info(`Dart3 server is listening on ${PORT}, ${JSON.stringify(process.env)}`),
);
