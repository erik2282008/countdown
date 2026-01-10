import { pool } from './db.js';
import { bot } from './bot.js';
import { POST_END } from './post_end_phrases.js';
import { PHRASES_7D, PHRASES_24H } from './phrases.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

// Раз в сутки
setInterval(async () => {
  const now = new Date();

  const groups = await pool.query(`SELECT chat_id FROM group_chats`);

  for (const g of groups.rows) {
    try {
      const members = await bot.getChatAdministrators(g.chat_id);
      // ⚠️ Telegram API НЕ ДАЁТ всех юзеров
      // поэтому мы проверяем ТОЛЬКО тех, кто писал боту ранее (из БД)

      const users = await pool.query(`
        SELECT telegram_id, death_timestamp, ended
        FROM users
      `);

      for (const u of users.rows) {
        const diff = new Date(u.death_timestamp) - now;
        const sec = Math.floor(diff / 1000);

        let message = null;

        if (u.ended || sec <= 0) {
          message =
            `💀 *${u.telegram_id}*\n` +
            random(POST_END);
        } else if (sec <= 86400) {
          message =
            `⏳ *${u.telegram_id}*\n` +
            random(PHRASES_24H) +
            `\n\n*${formatTime(sec)} left*`;
        } else if (sec <= 7 * 86400) {
          message =
            `⚠️ *${u.telegram_id}*\n` +
            random(PHRASES_7D) +
            `\n\n*${formatTime(sec)} left*`;
        } else {
          message =
            `🕰 *${u.telegram_id}*\n` +
            `Time remaining:\n*${formatTime(sec)}*`;
        }

        await bot.sendMessage(g.chat_id, message, {
          parse_mode: 'Markdown'
        });

        // анти-спам
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.error('Group watcher error:', e);
    }
  }
}, 24 * 60 * 60 * 1000);

console.log('👁 GROUP WATCHER STARTED');
