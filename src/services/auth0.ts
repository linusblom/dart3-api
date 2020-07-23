import { Context } from 'koa';
import { User } from 'dart3-sdk';
import humps from 'humps';

import { fetch } from '../utils';

const { AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_URL } = process.env;

export class Auth0Service {
  private token = '';
  private tokenExpires = 0;

  private async getToken(ctx: Context) {
    if (this.tokenExpires < Date.now()) {
      const { token_type, access_token, expires_in } = await fetch(
        ctx,
        `${AUTH0_URL}/oauth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=client_credentials&client_id=${AUTH0_CLIENT_ID}&client_secret=${AUTH0_CLIENT_SECRET}&audience=${AUTH0_URL}/api/v2/`,
        },
      );

      this.token = `${token_type} ${access_token}`;
      this.tokenExpires = expires_in * 1000 + Date.now();
    }

    return this.token;
  }

  async getUser(ctx: Context, userId: string) {
    const authorization = await this.getToken(ctx);

    const user = await fetch(ctx, `${AUTH0_URL}/api/v2/users/${userId}`, {
      method: 'get',
      headers: { authorization },
    });

    return humps.camelizeKeys(user as object) as User;
  }

  async updateUser(ctx: Context, userId: string, body) {
    const authorization = await this.getToken(ctx);

    const user = await fetch(ctx, `${AUTH0_URL}/api/v2/users/${userId}`, {
      method: 'patch',
      headers: { authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(humps.decamelizeKeys(body)),
    });

    return humps.camelizeKeys(user as object) as User;
  }
}
