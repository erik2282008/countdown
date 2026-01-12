import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from './db.js';
import './group_watcher.js';

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
  
  try {
    const { pool } = await import('./db.js');
    
    const existing = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    let deathTimestamp;
    
    if (existing.rows.length > 0) {
      deathTimestamp = existing.rows[0].death_timestamp;
    } else {
      const random = Math.random();
      let ms;
      
      if (random < 0.6) ms = (20 + Math.floor(Math.random() * 15)) * 24 * 60 * 60 * 1000;
      else if (random < 0.7) ms = (1 + Math.floor(Math.random() * 9)) * 24 * 60 * 60 * 1000;
      else if (random < 0.9) ms = (50 + Math.floor(Math.random() * 50)) * 365 * 24 * 60 * 60 * 1000;
      else ms = 24 * 60 * 60 * 1000;
      
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

    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json({ death: rows[0].death_timestamp });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initDB();
  console.log("🕳 COUNTDOWN SERVER RUNNING");
});

