import { Pool, QueryResult } from 'pg';
import pino from 'pino';

import { camelize } from '../utils';
import { SQLError, Param } from '../models';

const logger = pino();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const stringify = (array: Param[]) => array.map(value => `${value}`);

export const queryRaw = async <T>(
  query: string,
  params: Param[],
): Promise<[QueryResult<T>, SQLError]> => {
  try {
    const response = await pool.query<T>(query, stringify(params));
    return [response, null];
  } catch (err) {
    logger.info(err);
    return [null, err];
  }
};

export const queryAll = async <T>(query: string, params: Param[]): Promise<[T[], SQLError]> => {
  const [raw, err] = await queryRaw<T>(query, stringify(params));

  if (err) {
    return [null, err];
  }

  const rows = camelize(raw.rows) as T[];

  return [rows, null];
};

export const queryOne = async <T>(query: string, params: Param[]): Promise<[T, SQLError]> => {
  const [rows, err] = await queryAll<T>(query, stringify(params));

  if (err) {
    return [null, err];
  }

  return [rows[0], null];
};

export const queryId = async (query: string, params: Param[]): Promise<[number, SQLError]> => {
  const [first, err] = await queryOne<{ id: number }>(query, stringify(params));

  if (err) {
    return [null, err];
  }

  return [first && first.id, null];
};

export const queryVoid = async (query: string, params: Param[]): Promise<SQLError> => {
  const [_, err] = await queryRaw<void>(query, stringify(params));
  return err;
};

export const transaction = async (
  transactions: { query: string; params: Param[] }[],
): Promise<[any[], SQLError]> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const queries = await Promise.all(
      transactions.map(
        async ({ query, params }) => await client.query<{ id: number }>(query, stringify(params)),
      ),
    );
    await client.query('COMMIT');

    const response = queries.map(value => camelize(value.rows[0]));

    return [response, null];
  } catch (err) {
    await client.query('ROLLBACK');

    return [null, err];
  } finally {
    client.release();
  }
};
