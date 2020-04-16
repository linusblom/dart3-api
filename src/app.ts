import Koa from 'koa';
import cors from '@koa/cors';
import dotenv from 'dotenv';
import bodyParser from 'koa-bodyparser';

dotenv.config();

import { router } from './routes';
import { error, authorize, logger } from './middlewares';

const { PORT, ORIGIN } = process.env;
const app = new Koa();

app
  .use(cors({ origin: ORIGIN, credentials: true }))
  .use(logger)
  .use(error)
  .use(authorize)
  .use(bodyParser())
  .use(router.routes())

  .use(router.allowedMethods());

app.listen(PORT, () => console.log(`Dart3 server is listening on ${PORT}`));
