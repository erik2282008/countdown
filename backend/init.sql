CREATE TABLE IF NOT EXISTS users (
  telegram_id        BIGINT PRIMARY KEY,
  language           TEXT NOT NULL,
  death_timestamp    TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),

  warned_7d          BOOLEAN DEFAULT FALSE,
  warned_24h         BOOLEAN DEFAULT FALSE,

  ended              BOOLEAN DEFAULT FALSE,
  last_post_message  TIMESTAMPTZ,

  extensions         INT DEFAULT 0,

  -- 🔽 ДОБАВЛЕНО
  username           TEXT,
  first_name         TEXT,
  last_name          TEXT
  CREATE TABLE IF NOT EXISTS group_members (
  chat_id BIGINT,
  telegram_id BIGINT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, telegram_id)
);

