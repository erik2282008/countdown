import { pool } from './db.js';
import { sendWarningMessage } from './bot.js';
import { PHRASES_7D, PHRASES_24H } from './phrases.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Проверка каждые 30 секунд
setInterval(async () => {
  const now = new Date();

  try {
    const { rows } = await pool.query(`
      SELECT telegram_id, death_timestamp, warned_7d, warned_24h, ended
      FROM users 
      WHERE ended = FALSE
    `);

    for (const user of rows) {
      const diff = new Date(user.death_timestamp) - now;
      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

      // --- За 7 дней ---
      if (diff <= 7 * 86400000 && diff > 86400000 && !user.warned_7d) {
        try {
          await sendWarningMessage(user.telegram_id, random(PHRASES_7D));
          await pool.query(
            'UPDATE users SET warned_7d = TRUE WHERE telegram_id = $1',
            [user.telegram_id]
          );
        } catch (error) {
          console.error('Failed to send 7-day warning:', error);
        }
      }

      // --- За 24 часа ---
      if (diff <= 86400000 && diff > 0 && !user.warned_24h) {
        try {
          await sendWarningMessage(user.telegram_id, random(PHRASES_24H));
          await pool.query(
            'UPDATE users SET warned_24h = TRUE WHERE telegram_id = $1',
            [user.telegram_id]
          );
        } catch (error) {
          console.error('Failed to send 24-hour warning:', error);
        }
      }

      // --- Отметка окончания ---
      if (diff <= 0 && !user.ended) {
        await pool.query(
          'UPDATE users SET ended = TRUE WHERE telegram_id = $1',
          [user.telegram_id]
        );
      }
    }
  } catch (error) {
    console.error('Watcher error:', error);
  }
}, 30000); // Проверка каждые 30 секунд

console.log('👀 WATCHER STARTED - Checking every 30 seconds');
