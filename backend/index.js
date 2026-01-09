import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Импорты должны быть ДО запуска сервера
import('./bot.js').catch(e => console.error('Bot error:', e));
import('./watcher.js').catch(e => console.error('Watcher error:', e));
import('./post_end_watcher.js').catch(e => console.error('Post end watcher error:', e));

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// API: ACCEPT EULA + GENERATE DEATH DATE
app.post("/accept", async (req, res) => {
  console.log('📝 Accept endpoint called:', req.body);
  
  const { telegram_id, language } = req.body;
  
  if (!telegram_id || !language) {
    console.log('❌ Missing parameters');
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const { pool } = await import('./db.js');
    
    // Проверяем существование пользователя
    const existing = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    let deathTimestamp;
    
    if (existing.rows.length > 0) {
      // Используем существующее время
      deathTimestamp = existing.rows[0].death_timestamp;
      console.log('✅ Using existing time:', deathTimestamp);
    } else {
      // Генерируем новое время по весам
      const random = Math.random();
      let days;
      
      if (random < 0.6) {
        days = 20 + Math.floor(Math.random() * 15); // 60% - 20-35 дней
      } else if (random < 0.7) {
        days = 1 + Math.floor(Math.random() * 9); // 10% - 1-10 дней
      } else if (random < 0.9) {
        days = (50 + Math.floor(Math.random() * 50)) * 365; // 20% - 50-100 лет
      } else {
        days = 1; // 10% - 1 день
      }
      
      deathTimestamp = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      console.log('🎲 Generated new time:', deathTimestamp);
    }

    // Сохраняем в базу данных
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET language = $2, death_timestamp = $3`,
      [telegram_id, language, deathTimestamp]
    );
    
    console.log('✅ User saved to database');
    res.json({ success: true, death: deathTimestamp });
  } catch (error) {
    console.error('❌ Accept error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API: GET DEATH TIME
app.get("/time/:id", async (req, res) => {
  const telegramId = req.params.id;
  console.log('⏰ Time endpoint called for ID:', telegramId);
  
  try {
    const { pool } = await import('./db.js');
    const { rows } = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (!rows.length) {
      console.log('❌ User not found:', telegramId);
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log('✅ Time found:', rows[0].death_timestamp);
    res.json({ death: rows[0].death_timestamp });
  } catch (error) {
    console.error('❌ Time error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API: HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await initDB();
  console.log("🕳 COUNTDOWN SERVER RUNNING ON PORT", PORT);
  console.log("🌐 Health check: http://localhost:" + PORT + "/health");
});
