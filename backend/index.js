import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./bot.js";
import "./watcher.js";
import "./post_end_watcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ---------- STATIC FRONTEND ----------
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ---------- API: ACCEPT EULA + GENERATE DEATH DATE ----------
app.post("/accept", async (req, res) => {
  const { telegram_id, language } = req.body;
  
  if (!telegram_id || !language) return res.sendStatus(400);

  // Генерация случайной даты смерти (10 часов - 100 лет)
  const minHours = 10;
  const maxYears = 100;
  const randomMs = Math.floor(
    Math.random() * (maxYears * 365 * 24 * 60 * 60 * 1000 - minHours * 60 * 60 * 1000) 
    + minHours * 60 * 60 * 1000
  );
  const deathTimestamp = new Date(Date.now() + randomMs);

  try {
    const { pool } = await import('./db.js');
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET language = $2, death_timestamp = $3`,
      [telegram_id, language, deathTimestamp]
    );
    res.sendStatus(200);
  } catch (error) {
    console.error('Accept error:', error);
    res.sendStatus(500);
  }
});

// ---------- API: GET DEATH TIME ----------
app.get("/time/:id", async (req, res) => {
  const telegramId = req.params.id;
  
  try {
    const { pool } = await import('./db.js');
    const { rows } = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (!rows.length) return res.sendStatus(404);
    
    res.json({ death: rows[0].death_timestamp });
  } catch (error) {
    console.error('Time error:', error);
    res.sendStatus(500);
  }
});

// ---------- API: YOOKASSA PAYMENT ----------
app.post("/payment", async (req, res) => {
  const { telegram_id, type } = req.body;
  
  // Здесь будет интеграция с ЮКассой
  // Пока просто увеличиваем extensions
  try {
    const { pool } = await import('./db.js');
    await pool.query(
      'UPDATE users SET extensions = extensions + 1 WHERE telegram_id = $1',
      [telegram_id]
    );
    res.json({ success: true, message: "Time extended" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Payment failed" });
  }
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  const { initDB } = await import('./db.js');
  await initDB();
  console.log("🕳 COUNTDOWN SERVER RUNNING ON PORT", PORT);
});
