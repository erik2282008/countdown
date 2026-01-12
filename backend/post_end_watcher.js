import { pool } from './db.js';
import { bot } from './bot.js';
import { POST_END } from './post_end_phrases.js';
import { EULA_QUOTES_EN, EULA_QUOTES_RU } from './eula_fragments.js';
import { maybeCut } from './utils.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickQuote(lang) {
  return lang === 'RU'
    ? random(EULA_QUOTES_RU)
    : random(EULA_QUOTES_EN);
}

// Проверка каждую минуту
setInterval(async () => {
  const now = new Date();

  const { rows } = await pool.query(`
    SELECT telegram_id, language, last_post_message, extensions
    FROM users
    WHERE ended = TRUE
  `);

  for (const u of rows) {
    const baseInterval = 12 * 60 * 60 * 1000; // 12 часов
    const accel = (u.extensions || 0) * 2 * 60 * 60 * 1000; // -2 часа за отсрочку
    const interval = Math.max(60 * 60 * 1000, baseInterval - accel); // минимум 1 час

    if (
      !u.last_post_message ||
      now - new Date(u.last_post_message) > interval
    ) {
      const useEula = Math.random() < 0.5;
      const msg = useEula
        ? maybeCut(pickQuote(u.language || 'EN'))
        : random(POST_END);

      try {
        await bot.sendMessage(u.telegram_id, msg);
      } catch (_) {}

      await pool.query(
        'UPDATE users SET last_post_message = NOW() WHERE telegram_id = $1',
        [u.telegram_id]
      );
    }
  }
}, 60000);
