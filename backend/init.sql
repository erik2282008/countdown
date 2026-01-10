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
CREATE TABLE IF NOT EXISTS group_chats (
  chat_id BIGINT PRIMARY KEY,
  title TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
  ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;
);

