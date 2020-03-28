import { Pool } from 'pg';

type AlphaNum = string | number;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const stringify = (array: AlphaNum[]) => array.map(value => `${value}`);

export const queryRaw = (query: string, params: AlphaNum[]) => pool.query(query, stringify(params));

export const queryAll = async (query: string, params: AlphaNum[]) => {
  const { rows } = await pool.query(query, stringify(params));

  return rows;
};

export const queryOne = async (query: string, params: AlphaNum[]) => {
  const {
    rows: [first],
  } = await pool.query(query, stringify(params));

  return first;
};
