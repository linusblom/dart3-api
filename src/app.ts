import Koa from 'koa';
import cors from '@koa/cors';
import dotenv from 'dotenv';
import bodyParser from 'koa-bodyparser';

import { router } from './routes';
import { error, authorize } from './middlewares';

dotenv.config();
const { PORT, ORIGIN } = process.env;
const app = new Koa();

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(error);
app.use(authorize);
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => console.log(`Dart3 server is listening on ${PORT}`));
