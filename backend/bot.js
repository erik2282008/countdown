import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN || '8447119124:AAHFwKTxugSjG7_3of3JW4PCjhexo19Quxc';

export const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const telegramId = msg.from.id;

  try {
    const res = await pool.query(
      'SELECT telegram_id FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (res.rowCount === 0) {
      await pool.query(
        `INSERT INTO users (telegram_id, language, death_timestamp)
         VALUES ($1, $2, NOW() + INTERVAL '1 year')`,
        [telegramId, 'EN']
      );
    }

    await bot.sendMessage(
      telegramId,
      'OPEN THE APPLICATION',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'OPEN',
                web_app: {
                  url: process.env.APP_URL || 'https://peculiar-ericha-erikos-a5e4ca37.koyeb.app/'
                }
              }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error('BOT DB ERROR:', err);
  }
});
