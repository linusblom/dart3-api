import { Context } from 'koa';
import { User } from 'dart3-sdk';
import humps from 'humps';

import { fetch } from '../utils';

const { AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_URL } = process.env;

export class Auth0Service {
  private static instance: Auth0Service;
  private token = '';
  private tokenExpires = 0;

  private constructor() {}

  static getInstance(): Auth0Service {
    if (!Auth0Service.instance) {
      Auth0Service.instance = new Auth0Service();
    }

    return Auth0Service.instance;
  }

  private async getToken(ctx: Context) {
    if (this.tokenExpires < Date.now()) {
      const { tokenType, accessToken, expiresIn } = await fetch(ctx, `${AUTH0_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${AUTH0_CLIENT_ID}&client_secret=${AUTH0_CLIENT_SECRET}&audience=${AUTH0_URL}/api/v2/`,
      });

      this.token = `${tokenType} ${accessToken}`;
      this.tokenExpires = expiresIn * 1000 + Date.now();
    }

    return this.token;
  }

  async getUser(ctx: Context, userId: string) {
    const authorization = await this.getToken(ctx);

    const user = await fetch<User>(ctx, `${AUTH0_URL}/api/v2/users/${userId}`, {
      method: 'get',
      headers: { authorization },
    });

    return user;
  }

  async getUserMetaData(ctx: Context, userId: string) {
    const authorization = await this.getToken(ctx);

    const { userMetadata } = await fetch<User>(
      ctx,
      `${AUTH0_URL}/api/v2/users/${userId}?fields=user_metadata`,
      {
        method: 'get',
        headers: { authorization },
      },
    );

    return userMetadata;
  }

  async updateUser(ctx: Context, userId: string, body) {
    const authorization = await this.getToken(ctx);

    const user = await fetch<User>(ctx, `${AUTH0_URL}/api/v2/users/${userId}`, {
      method: 'patch',
      headers: { authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(humps.decamelizeKeys(body)),
    });

    return user;
  }
}
