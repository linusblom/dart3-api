import { query } from '../database';

export class PlayerRepository {
  async get(accountId: string) {
    const { rows } = await query('SELECT * FROM player where account_id = $1', [accountId]);
    return rows;
  }

  async getById(id: string, accountId: string) {
    const { rows } = await query('SELECT * FROM player where id = $1 and account_id = $2', [
      id,
      accountId,
    ]);
    return rows[0];
  }

  async create(accountId: string, name: string, email: string, color: string, avatar: string) {
    const {
      rows,
    } = await query(
      'INSERT INTO player (account_id, name, email, color, avatar) values($1, $2, $3, $4, $5) RETURNING id;',
      [accountId, name, email, color, avatar],
    );
    return rows[0].id;
  }
}
