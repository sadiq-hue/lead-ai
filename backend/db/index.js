import dotenv from 'dotenv';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const connectionOptions = {};

if (process.env.DATABASE_URL) {
  connectionOptions.connectionString = process.env.DATABASE_URL;
} else {
  connectionOptions.host = process.env.PGHOST || 'localhost';
  connectionOptions.port = Number(process.env.PGPORT || 5432);
  connectionOptions.user = process.env.PGUSER || 'postgres';
  connectionOptions.password = process.env.PGPASSWORD || '';
  connectionOptions.database = process.env.PGDATABASE || 'leadai';
}

if (process.env.PGSSLMODE) {
  connectionOptions.ssl =
    process.env.PGSSLMODE === 'require' || process.env.PGSSLMODE === 'true'
      ? { rejectUnauthorized: false }
      : false;
}

const pool = new Pool(connectionOptions);

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err);
  process.exit(-1);
});

export const query = async (text, params) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export const close = async () => {
  await pool.end();
};
