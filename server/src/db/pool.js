import pg from 'pg';
import { config } from '../config.js';

// DATE columns come back as plain 'YYYY-MM-DD' strings instead of shifted JS Dates
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({
  ...config.db,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => console.error('[db] idle client error', err.message));

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
