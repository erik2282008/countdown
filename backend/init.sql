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
);
