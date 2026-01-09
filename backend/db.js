import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id        BIGINT PRIMARY KEY,
      language           TEXT NOT NULL,
      death_timestamp    TIMESTAMPTZ NOT NULL,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      warned_7d          BOOLEAN DEFAULT FALSE,
      warned_24h         BOOLEAN DEFAULT FALSE,
      ended              BOOLEAN DEFAULT FALSE,
      last_post_message  TIMESTAMPTZ,
      extensions         INT DEFAULT 0
    );
  `);

  console.log("DB READY");
}

