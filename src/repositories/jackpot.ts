import { IDatabase, IMain } from 'pg-promise';

export class JackpotRepository {
  constructor(private db: IDatabase<any>, private pgp: IMain) {}

  init(userId: string) {
    return this.db.none('INSERT INTO jackpot (user_id) VALUES ($1)', [userId]);
  }

  get(userId: string) {
    return this.db.one(
      'SELECT value, next_value FROM jackpot WHERE user_id = $1 AND won_at IS NULL',
      [userId],
    );
  }
}
