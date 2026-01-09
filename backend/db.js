import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// ---------- ПРОВЕРКА ПОДКЛЮЧЕНИЯ ----------
pool.on('connect', () => {
  console.log('DATABASE CONNECTED');
});

pool.on('error', (err) => {
  console.error('DATABASE ERROR', err);
  process.exit(1);
});
