import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN;
const ADMIN_ID = 647773442;

if (!token) {
  console.error('❌ BOT_TOKEN not found! Bot will not start.');
  export const bot = {
    onText: () => {},
    sendMessage: async () => console.log('Bot disabled - no token')
  };
} else {
  console.log('✅ Bot starting...');
  export const bot = new TelegramBot(token, { polling: true });

  // Проверка админских прав
  function isAdmin(msg) {
    return msg.from.id === ADMIN_ID || msg.from.username === 'smknnnn';
  }

  // ===================== АДМИН КОМАНДЫ =====================

  bot.onText(/\/admin/, async (msg) => {
    if (!isAdmin(msg)) return;
    
    await bot.sendMessage(
      msg.chat.id,
      `🕳 *ADMIN PANEL*\n\nUser ID: ${msg.from.id}\nStatus: ADMIN\n\nAvailable commands:\n• /stats - Show statistics\n• /broadcast - Send message to all users`,
      { parse_mode: 'Markdown' }
    );
  });

  // Статистика
  bot.onText(/\/stats/, async (msg) => {
    if (!isAdmin(msg)) return;

    try {
      const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
      const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE death_timestamp > NOW()');
      const endedUsers = await pool.query('SELECT COUNT(*) FROM users WHERE ended = TRUE');
      
      await bot.sendMessage(
        msg.chat.id,
        `📊 *STATISTICS*\n\n` +
        `Total users: ${totalUsers.rows[0].count}\n` +
        `Active countdowns: ${activeUsers.rows[0].count}\n` +
        `Finished countdowns: ${endedUsers.rows[0].count}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      await bot.sendMessage(msg.chat.id, 'Error getting statistics');
    }
  });

  // Рассылка сообщения всем пользователям
  bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    if (!isAdmin(msg)) return;

    const message = match[1];
    if (!message) {
      await bot.sendMessage(msg.chat.id, 'Usage: /broadcast Your message here');
      return;
    }

    try {
      const { rows } = await pool.query('SELECT telegram_id FROM users');
      let success = 0;
      let failed = 0;

      await bot.sendMessage(msg.chat.id, `📤 Starting broadcast to ${rows.length} users...`);

      for (const user of rows) {
        try {
          await bot.sendMessage(user.telegram_id, message);
          success++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Задержка
        } catch (error) {
          failed++;
        }
      }

      await bot.sendMessage(
        msg.chat.id,
        `📤 *BROADCAST COMPLETE*\n\n` +
        `Message: ${message}\n` +
        `Success: ${success} users\n` +
        `Failed: ${failed} users\n` +
        `Total: ${rows.length} users`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      await bot.sendMessage(msg.chat.id, 'Broadcast error: ' + error.message);
    }
  });

  // ===================== СТАНДАРТНАЯ КОМАНДА =====================
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
}
