import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(__dirname, 'migration_stock_statements.sql');

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'leadai',
    };

if (process.env.PGSSLMODE) {
  poolConfig.ssl =
    process.env.PGSSLMODE === 'require' || process.env.PGSSLMODE === 'true'
      ? { rejectUnauthorized: false }
      : false;
}

const pool = new Pool(poolConfig);

const run = async () => {
  try {
    console.log('Reading migration from', migrationPath);
    const migration = await fs.readFile(migrationPath, 'utf8');
    console.log('Applying stock statements migration...');
    await pool.query(migration);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
