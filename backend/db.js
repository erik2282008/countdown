import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  // ===== users =====
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

  // ===== add user identity fields =====
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT;
  `);

  // ===== group members mapping =====
  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      chat_id BIGINT,
      telegram_id BIGINT,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (chat_id, telegram_id)
    );
  `);

  console.log("DB READY");
}
