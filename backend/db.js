import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  try {
    // ===== ОСНОВНЫЕ ТАБЛИЦЫ =====
    
    // Таблица пользователей
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
        extensions         INT DEFAULT 0,
        username           TEXT,
        first_name         TEXT,
        last_name          TEXT
      );
    `);

    // Таблица участников групп
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        chat_id BIGINT,
        telegram_id BIGINT,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (chat_id, telegram_id)
      );
    `);

    // Таблица групповых чатов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_chats (
        chat_id BIGINT PRIMARY KEY,
        title TEXT,
        added_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ===== ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ =====
    
    // Для быстрого поиска пользователей
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_death_timestamp 
      ON users(death_timestamp);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_ended 
      ON users(ended);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_language 
      ON users(language);
    `);

    // Для групповых запросов
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_chat_id 
      ON group_members(chat_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_telegram_id 
      ON group_members(telegram_id);
    `);

    // ===== ПРОВЕРКА СОЕДИНЕНИЯ =====
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log("✅ DATABASE CONNECTION SUCCESSFUL");
    } finally {
      client.release();
    }

    console.log("🗃️ DATABASE INITIALIZED SUCCESSFULLY");
    
  } catch (error) {
    console.error("❌ DATABASE INITIALIZATION ERROR:", error);
    throw error;
  }
}

// Функция для безопасного выполнения запросов
export async function safeQuery(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Функция для получения пользователя по ID
export async function getUser(telegramId) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Функция для обновления времени смерти
export async function updateDeathTimestamp(telegramId, newTimestamp) {
  try {
    await pool.query(
      'UPDATE users SET death_timestamp = $1 WHERE telegram_id = $2',
      [newTimestamp, telegramId]
    );
    return true;
  } catch (error) {
    console.error('Update death timestamp error:', error);
    return false;
  }
}

// Функция для добавления участника группы
export async function addGroupMember(chatId, telegramId) {
  try {
    await pool.query(
      `INSERT INTO group_members (chat_id, telegram_id)
       VALUES ($1, $2)
       ON CONFLICT (chat_id, telegram_id) DO NOTHING`,
      [chatId, telegramId]
    );
    return true;
  } catch (error) {
    console.error('Add group member error:', error);
    return false;
  }
}

// Функция для получения участников группы
export async function getGroupMembers(chatId) {
  try {
    const { rows } = await pool.query(
      `SELECT u.* FROM users u
       JOIN group_members gm ON u.telegram_id = gm.telegram_id
       WHERE gm.chat_id = $1`,
      [chatId]
    );
    return rows;
  } catch (error) {
    console.error('Get group members error:', error);
    return [];
  }
}

// Обработка отключения от базы данных
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  await pool.end();
  process.exit(0);
});
