import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// 🔽 ПРАВИЛЬНЫЙ ПУТЬ К ФРОНТЕНДУ
app.use(express.static(path.join(__dirname, "../frontend")));

// Импортируем и запускаем бота
import('./bot.js').catch(console.error);

// Импортируем наблюдателей
import('./watcher.js').catch(console.error);
import('./post_end_watcher.js').catch(console.error);
import('./group_watcher.js').catch(console.error);

// 🔽 ДОБАВЛЯЕМ API РОУТЫ
import apiRouter from './api.js';
app.use('/api', apiRouter);

// Главная страница - отдаем фронтенд
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 🔽 ЭНДПОИНТ ДЛЯ ПРИНЯТИЯ EULA И ГЕНЕРАЦИИ ВРЕМЕНИ
app.post("/accept", async (req, res) => {
  const { telegram_id, language } = req.body;
  
  try {
    const { pool } = await import('./db.js');
    
    // Проверяем существующего пользователя
    const existing = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    let deathTimestamp;
    
    if (existing.rows.length > 0) {
      // Если пользователь уже есть - используем существующее время
      deathTimestamp = existing.rows[0].death_timestamp;
    } else {
      // Генерируем случайное время по весам
      const random = Math.random();
      let ms;
      
      if (random < 0.6) {
        // 60% - 20-35 дней
        ms = (20 + Math.floor(Math.random() * 15)) * 24 * 60 * 60 * 1000;
      } else if (random < 0.7) {
        // 10% - 1-10 дней
        ms = (1 + Math.floor(Math.random() * 9)) * 24 * 60 * 60 * 1000;
      } else if (random < 0.9) {
        // 20% - 50-100 лет
        ms = (50 + Math.floor(Math.random() * 50)) * 365 * 24 * 60 * 60 * 1000;
      } else {
        // 10% - 1 день
        ms = 24 * 60 * 60 * 1000;
      }
      
      deathTimestamp = new Date(Date.now() + ms);
    }

    // Сохраняем/обновляем пользователя
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET language = $2, death_timestamp = $3`,
      [telegram_id, language, deathTimestamp]
    );
    
    res.json({ success: true, death: deathTimestamp });
  } catch (error) {
    console.error('Accept error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔽 ЭНДПОИНТ ДЛЯ ПОЛУЧЕНИЯ ВРЕМЕНИ ПОЛЬЗОВАТЕЛЯ
app.get("/time/:id", async (req, res) => {
  const telegramId = req.params.id;
  
  try {
    const { pool } = await import('./db.js');
    const { rows } = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ death: rows[0].death_timestamp });
  } catch (error) {
    console.error('Time endpoint error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check эндпоинт
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

// Запускаем сервер после инициализации БД
app.listen(PORT, async () => {
  try {
    await initDB();
    console.log("🕳 COUNTDOWN SERVER RUNNING ON PORT", PORT);
    console.log("📊 DATABASE INITIALIZED");
    console.log("🤖 BOT STARTED");
    console.log("👀 WATCHERS ACTIVATED");
  } catch (error) {
    console.error("FAILED TO START SERVER:", error);
    process.exit(1);
  }
});

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
