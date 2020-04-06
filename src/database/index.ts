import { Pool } from 'pg';
import { camelCase } from 'lodash';

type AlphaNum = string | number;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const stringify = (array: AlphaNum[]) => array.map(value => `${value}`);

const camelizeKeys = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelizeKeys(v));
  } else if (obj && obj.constructor === Object) {
    return Object.entries(obj).reduce(
      (result, [key, value]) => ({
        ...result,
        [camelCase(key)]: camelizeKeys(value),
      }),
      {},
    );
  }
  return obj;
};

export const queryRaw = async (query: string, params: AlphaNum[]) => {
  try {
    const response = await pool.query(query, stringify(params));
    return [response, null];
  } catch (err) {
    console.error({ code: err.code, message: err.detail });
    return [null, err];
  }
};

export const queryAll = async <T>(query: string, params: AlphaNum[]): Promise<T[]> => {
  const [response, err] = await queryRaw(query, stringify(params));

  if (err !== null) {
    return null;
  }

  return camelizeKeys(response.rows);
};

export const queryOne = async <T>(query: string, params: AlphaNum[]): Promise<T> => {
  const [response, err] = await queryRaw(query, stringify(params));

  if (err !== null) {
    return null;
  }

  const [first] = response.rows;

  return camelizeKeys(first);
};
