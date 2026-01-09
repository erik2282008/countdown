import { pool } from './db.js';
import { bot } from './bot.js';
import { PHRASES_7D, PHRASES_24H } from './phrases.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Проверка каждую минуту
setInterval(async () => {
  const now = new Date();

  const { rows } = await pool.query(`
    SELECT telegram_id, death_timestamp, warned_7d, warned_24h, extensions
    FROM users
    WHERE ended = FALSE
  `);

  for (const u of rows) {
    const diff = new Date(u.death_timestamp) - now;

    // --- За 7 дней ---
    if (diff <= 7 * 86400000 && diff > 86400000 && !u.warned_7d) {
      try {
        await bot.sendMessage(u.telegram_id, random(PHRASES_7D));
      } catch (_) {}

      await pool.query(
        'UPDATE users SET warned_7d = TRUE WHERE telegram_id = $1',
        [u.telegram_id]
      );
    }

    // --- За 24 часа ---
    if (diff <= 86400000 && diff > 0 && !u.warned_24h) {
      try {
        await bot.sendMessage(u.telegram_id, random(PHRASES_24H));
      } catch (_) {}

      await pool.query(
        'UPDATE users SET warned_24h = TRUE WHERE telegram_id = $1',
        [u.telegram_id]
      );
    }

    // --- Усиление от отсрочек (редкие дополнительные сообщения) ---
    const accelChance = Math.min(0.05, (u.extensions || 0) * 0.01);
    if (Math.random() < accelChance) {
      try {
        await bot.sendMessage(u.telegram_id, 'IT IS WATCHING YOU');
      } catch (_) {}
    }
  }
}, 60000);
