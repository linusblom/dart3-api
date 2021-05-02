import { koaJwtSecret } from 'jwks-rsa';
import koaJwt from 'koa-jwt';

const { AUTH0_AUDIENCE, AUTH0_DOMAIN } = process.env;

export const authError = (ctx, next) =>
  next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
    } else {
      throw err;
    }
  });

export const jwt = koaJwt({
  secret: koaJwtSecret({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 36000000,
  }),
  algorithms: ['RS256'],
  issuer: [`https://${AUTH0_DOMAIN}/`],
  audience: [AUTH0_AUDIENCE],
}).unless({ path: [/^\/v1\/pub\/(ping|verify)$/] });
