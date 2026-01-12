-- Создание таблицы пользователей
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
  username           TEXT,
  first_name         TEXT,
  last_name          TEXT
);

-- Создание таблицы участников групп
CREATE TABLE IF NOT EXISTS group_members (
  chat_id BIGINT,
  telegram_id BIGINT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, telegram_id)
);

-- Создание таблицы групповых чатов
CREATE TABLE IF NOT EXISTS group_chats (
  chat_id BIGINT PRIMARY KEY,
  title TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_users_death_timestamp ON users(death_timestamp);
CREATE INDEX IF NOT EXISTS idx_users_ended ON users(ended);
CREATE INDEX IF NOT EXISTS idx_group_members_chat_id ON group_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_group_members_telegram_id ON group_members(telegram_id);

-- Добавление недостающих колонок если они существуют (для совместимости)
DO $$ 
BEGIN
    -- Добавляем колонку username если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;
    
    -- Добавляем колонку first_name если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name TEXT;
    END IF;
    
    -- Добавляем колонку last_name если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name TEXT;
    END IF;
    
    -- Добавляем колонку extensions если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'extensions') THEN
        ALTER TABLE users ADD COLUMN extensions INT DEFAULT 0;
    END IF;
END $$;
