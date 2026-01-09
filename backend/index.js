import express from 'express';
import { pool } from './db.js';
import './bot.js';
import './watcher.js';
import './post_end_watcher.js';

const app = express();

app.use(express.json());
app.use(express.static('frontend'));

// ---------- ГЕНЕРАЦИЯ ДАТЫ ----------
function generateDeathTimestamp() {
  const min = 10 * 60 * 60 * 1000; // 10 часов
  const max = 100 * 365 * 24 * 60 * 60 * 1000; // 100 лет
  const now = Date.now();
  return new Date(now + min + Math.random() * (max - min));
}

// ---------- ACCEPT ----------
app.post('/accept', async (req, res) => {
  const { telegram_id, language } = req.body;

  if (!telegram_id || !language) {
    return res.sendStatus(400);
  }

  const existing = await pool.query(
    'SELECT telegram_id FROM users WHERE telegram_id = $1',
    [telegram_id]
  );

  if (existing.rows.length === 0) {
    const death = generateDeathTimestamp();
    await pool.query(
      `INSERT INTO users 
       (telegram_id, language, death_timestamp)
       VALUES ($1, $2, $3)`,
      [telegram_id, language, death]
    );
  }

  res.sendStatus(200);
});

// ---------- TIME ----------
app.get('/time/:telegram_id', async (req, res) => {
  const { telegram_id } = req.params;

  const result = await pool.query(
    `SELECT death_timestamp, ended 
     FROM users 
     WHERE telegram_id = $1`,
    [telegram_id]
  );

  if (result.rows.length === 0) {
    return res.sendStatus(404);
  }

  const { death_timestamp, ended } = result.rows[0];
  const now = new Date();
  const death = new Date(death_timestamp);

  if (now >= death && !ended) {
    await pool.query(
      'UPDATE users SET ended = TRUE WHERE telegram_id = $1',
      [telegram_id]
    );
  }

  res.json({ death });
});

// ---------- START ----------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('COUNTDOWN SERVER RUNNING');
});

