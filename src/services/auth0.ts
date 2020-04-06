import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { fetch, camelize, response } from '../utils';

const {
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_API_URL,
  AUTH0_OAUTH_URL,
  AUTH0_API_AUDIENCE,
} = process.env;

export class Auth0Service {
  private token = '';
  private tokenExpires = 0;

  private async getToken(ctx: Context) {
    if (this.tokenExpires < Date.now()) {
      const { token_type, access_token, expires_in } = await fetch(ctx, AUTH0_OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${AUTH0_CLIENT_ID}&client_secret=${AUTH0_CLIENT_SECRET}&audience=${AUTH0_API_AUDIENCE}`,
      });

      this.token = `${token_type} ${access_token}`;
      this.tokenExpires = expires_in * 1000 + Date.now();
    }

    return this.token;
  }

  async getAccount(ctx: Context, accountId: string) {
    const authorization = await this.getToken(ctx);

    const user = await fetch(ctx, `${AUTH0_API_URL}/users/${accountId}`, {
      method: 'get',
      headers: { Authorization: authorization },
    });

    return response(ctx, httpStatusCodes.OK, camelize(user));
  }
}
