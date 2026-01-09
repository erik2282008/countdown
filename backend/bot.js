import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN;
export const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const telegramId = msg.from.id;

  try {
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, NOW() + INTERVAL '1 year')
       ON CONFLICT (telegram_id) DO NOTHING`,
      [telegramId, 'EN']
    );

    await bot.sendMessage(
      telegramId,
      '🕳 *COUNTDOWN*\n\n_YOUR TIME IS ALREADY COUNTING_\n\n▼',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🕳 REVEAL',
                web_app: {
                  url: process.env.APP_URL
                }
              }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error('BOT ERROR:', err);
  }
});
