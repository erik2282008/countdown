import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN;
const ADMIN_ID = 647773442;
const ADMIN_USERNAME = 'smknnnn';

export const bot = new TelegramBot(token, { polling: true });

// Проверка админских прав
function isAdmin(msg) {
  return msg.from.id === ADMIN_ID || msg.from.username === ADMIN_USERNAME;
}

// ===================== АДМИН КОМАНДЫ =====================

// Команда для проверки админских прав
bot.onText(/\/admin/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  await bot.sendMessage(
    msg.chat.id,
    `🕳 *ADMIN PANEL*\n\n` +
    `User ID: ${msg.from.id}\n` +
    `Username: @${msg.from.username || 'none'}\n` +
    `Status: 🔒 ADMIN\n\n` +
    `*Available commands:*\n` +
    `• /stats - Show statistics\n` +
    `• /broadcast [message] - Send message to all users\n` +
    `• /test - Test message to yourself\n` +
    `• /users - List all users`,
    { parse_mode: 'Markdown' }
  );
});

// Статистика пользователей
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE death_timestamp > NOW()');
    const endedUsers = await pool.query('SELECT COUNT(*) FROM users WHERE ended = TRUE');
    
    const now = new Date();
    const recentUsers = await pool.query(
      'SELECT COUNT(*) FROM users WHERE created_at > $1',
      [new Date(now.getTime() - 24 * 60 * 60 * 1000)] // Последние 24 часа
    );
    
    await bot.sendMessage(
      msg.chat.id,
      `📊 *STATISTICS*\n\n` +
      `👥 Total users: ${totalUsers.rows[0].count}\n` +
      `⏳ Active countdowns: ${activeUsers.rows[0].count}\n` +
      `💀 Finished countdowns: ${endedUsers.rows[0].count}\n` +
      `🆕 Last 24h: ${recentUsers.rows[0].count}\n` +
      `🕒 Server time: ${now.toISOString()}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting statistics');
  }
});

// Рассылка сообщения всем пользователям
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;

  const message = match[1];
  if (!message) {
    await bot.sendMessage(msg.chat.id, '❌ Usage: /broadcast Your message here');
    return;
  }

  try {
    const { rows } = await pool.query('SELECT telegram_id FROM users');
    let success = 0;
    let failed = 0;

    await bot.sendMessage(msg.chat.id, `📤 Starting broadcast to ${rows.length} users...`);

    for (const user of rows) {
      try {
        await bot.sendMessage(user.telegram_id, `📢 *BROADCAST:* ${message}`, {
          parse_mode: 'Markdown'
        });
        success++;
        // Задержка чтобы не спамить
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `✅ *BROADCAST COMPLETE*\n\n` +
      `📝 Message: ${message}\n` +
      `✅ Success: ${success} users\n` +
      `❌ Failed: ${failed} users\n` +
      `📊 Total: ${rows.length} users`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ Broadcast error: ${error.message}`);
  }
});

// Тестовое сообщение
bot.onText(/\/test/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  await bot.sendMessage(
    msg.chat.id,
    '🧪 *TEST MESSAGE*\n\nAdmin commands are working correctly!\nBot is online and responsive.',
    { parse_mode: 'Markdown' }
  );
});

// Список пользователей
bot.onText(/\/users/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const { rows } = await pool.query(
      'SELECT telegram_id, language, death_timestamp, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    
    let userList = '👥 *LAST 10 USERS*\n\n';
    rows.forEach((user, index) => {
      const timeLeft = Math.floor((new Date(user.death_timestamp) - new Date()) / (1000 * 60 * 60 * 24));
      userList += `${index + 1}. ID: ${user.telegram_id}\n   Lang: ${user.language}\n   Days left: ${timeLeft}\n   Joined: ${new Date(user.created_at).toLocaleDateString()}\n\n`;
    });
    
    await bot.sendMessage(msg.chat.id, userList, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting user list');
  }
});

// ===================== СТАНДАРТНАЯ КОМАНДА ДЛЯ ПОЛЬЗОВАТЕЛЕЙ =====================
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
      '💀 *COUNTDOWN* 💀\n\n┏━━━━━━━━━━━━━━━━━━┓\n' +
      '┃ YOUR TIME WAS    ┃\n' +
      '┃ ALWAYS COUNTING  ┃\n' +
      '┃                  ┃\n' +
      '┃ THE NUMBERS      ┃\n' +
      '┃ WERE ALREADY     ┃\n' +
      '┃ THERE            ┃\n' +
      '┃                  ┃\n' +
      '┃ NOW YOU WILL     ┃\n' +
      '┃ SEE THEM         ┃\n' +
      '┗━━━━━━━━━━━━━━━━━━┛\n\n' +
      '_There is no going back._\n' +
      '_The countdown never began._\n' +
      '_It was merely revealed._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🩸 REVEAL YOUR FATE 🩸',
              web_app: { 
                url: process.env.APP_URL || 'https://your-app-url.here'
              }
            }
          ]]
        }
      }
    );
  } catch (err) {
    console.error('BOT START ERROR:', err);
    // Пытаемся отправить сообщение об ошибке
    try {
      await bot.sendMessage(
        telegramId,
        '⚠️ *ERROR*\n\nPlease try again later.',
        { parse_mode: 'Markdown' }
      );
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
});

// ===================== ОБРАБОТКА ОШИБОК =====================
bot.on('polling_error', (error) => {
  console.error('POLLING ERROR:', error);
});

bot.on('webhook_error', (error) => {
  console.error('WEBHOOK ERROR:', error);
});

// ===================== СООБЩЕНИЯ ОТ "ОНО" ПОСЛЕ КОНЦА ТАЙМЕРА =====================
// Эта функция будет вызываться из post_end_watcher.js
export async function sendPostEndMessage(telegramId, message) {
  try {
    await bot.sendMessage(
      telegramId,
      `👻 *IT SPEAKS*\n\n${message}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Failed to send post-end message:', error);
  }
}

// ===================== ПРЕДУПРЕЖДЕНИЯ ЗА 7 ДНЕЙ И 24 ЧАСА =====================
// Эта функция будет вызываться из watcher.js
export async function sendWarningMessage(telegramId, message) {
  try {
    await bot.sendMessage(
      telegramId,
      `⚠️ *WARNING*\n\n${message}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Failed to send warning message:', error);
  }
}

console.log('🤖 COUNTDOWN BOT STARTED SUCCESSFULLY');
console.log(`🔐 ADMIN ID: ${ADMIN_ID}`);
console.log(`🔐 ADMIN USERNAME: ${ADMIN_USERNAME}`);
