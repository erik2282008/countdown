import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT 1')
  .then(() => console.log('DATABASE CONNECTED'))
  .catch(err => {
    console.error('DATABASE CONNECTION FAILED');
    console.error(err);
    process.exit(1);
  });
