import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

import('./bot.js').catch(console.error);
import('./watcher.js').catch(console.error);
import('./post_end_watcher.js').catch(console.error);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.post("/accept", async (req, res) => {
  const { telegram_id, language } = req.body;
  
  if (!telegram_id || !language) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const { pool } = await import('./db.js');
    
    // Проверяем, есть ли уже пользователь
    const existing = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    let deathTimestamp;
    
    if (existing.rows.length > 0) {
      // Используем существующее время
      deathTimestamp = existing.rows[0].death_timestamp;
    } else {
      // Генерируем новое время по весам
      const random = Math.random();
      let ms;
      
      if (random < 0.6) { // 60% - 20-35 дней
        const days = 20 + Math.floor(Math.random() * 15);
        ms = days * 24 * 60 * 60 * 1000;
      } 
      else if (random < 0.7) { // 10% - до 10 дней
        const days = 1 + Math.floor(Math.random() * 9);
        ms = days * 24 * 60 * 60 * 1000;
      }
      else if (random < 0.9) { // 20% - 50-100 лет
        const years = 50 + Math.floor(Math.random() * 50);
        ms = years * 365 * 24 * 60 * 60 * 1000;
      }
      else { // 10% - 1 день
        ms = 24 * 60 * 60 * 1000;
      }
      
      deathTimestamp = new Date(Date.now() + ms);
    }

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
    console.error('Time error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initDB();
  console.log("🕳 COUNTDOWN SERVER RUNNING ON PORT", PORT);
});
