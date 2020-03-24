import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text: string, params: string[]) => pool.query(text, params);
