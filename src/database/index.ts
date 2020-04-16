import { Pool } from 'pg';

import { camelize } from '../utils';

type AlphaNum = string | number;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const stringify = (array: AlphaNum[]) => array.map(value => `${value}`);

export const queryRaw = async (query: string, params: AlphaNum[]) => {
  try {
    const response = await pool.query(query, stringify(params));
    return [response, null];
  } catch (err) {
    return [null, err];
  }
};

export const queryAll = async (query: string, params: AlphaNum[]) => {
  const [raw, err] = await queryRaw(query, stringify(params));

  if (err) {
    return [null, err];
  }

  return [camelize(raw.rows), null];
};

export const queryOne = async (query: string, params: AlphaNum[]) => {
  const [rows, err] = await queryAll(query, stringify(params));

  if (err) {
    return [null, err];
  }

  const [first] = rows;

  return [first, null];
};

export const queryId = async (query: string, params: AlphaNum[]) => {
  const [first, err] = await queryOne(query, stringify(params));

  if (err) {
    return [null, err];
  }

  return [first && first.id, null];
};

export const transaction = async (transactions: { query: string; params: AlphaNum[] }[]) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const queries = await Promise.all(
      transactions.map(async ({ query, params }) => await client.query(query, stringify(params))),
    );
    await client.query('COMMIT');

    const response = queries.map(value => {
      const [first] = value.rows;
      return camelize(first);
    });

    return [response, null];
  } catch (err) {
    await client.query('ROLLBACK');

    return [null, err];
  } finally {
    client.release();
  }
};
