import { IDatabase, IMain } from 'pg-promise';

export class JackpotRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  get(userId: string) {
    return this.db.one(
      'SELECT value, next_value FROM jackpot WHERE user_id = $1 AND won_at IS NULL',
      [userId],
    );
  }
}
