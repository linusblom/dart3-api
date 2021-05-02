import { Context } from 'koa';
import httpStatusCodes from 'http-status-codes';

import { db } from '../database';
import { errorResponse, response } from '../utils';
import { Role } from 'dart3-sdk';

export class PublicController {
  async getVerifyEmail(ctx: Context, uid: string, token: string) {
    try {
      const verification = await db.player.findEmailVerification(uid, token);
      const email = verification.email
        .split('')
        .map((char, index, array) =>
          ['.', '@'].includes(char) || [undefined, '.', '@'].includes(array[index + 1])
            ? char
            : '*',
        )
        .join('');

      return response(ctx, httpStatusCodes.OK, { email });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }
  }

  async verifyEmail(ctx: Context, uid: string, token: string) {
    try {
      return db.task(async (t) => {
        const verification = await t.player.findEmailVerification(uid, token);
        await t.player.toggleRoles(verification.userId, uid, [Role.EmailVerified], []);
        await t.player.deleteEmailVerification(uid);

        return response(ctx, httpStatusCodes.OK);
      });
    } catch (err) {
      return errorResponse(ctx, httpStatusCodes.BAD_REQUEST);
    }
  }
}
