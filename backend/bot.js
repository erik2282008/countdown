import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN;
const ADMIN_ID = 647773442;
const ADMIN_USERNAME = 'smknnnn';

export const bot = new TelegramBot(token, { polling: true });

let BOT_USERNAME = null;
bot.getMe().then(me => {
  BOT_USERNAME = me.username;
});

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

// ===================== КОМАНДА ДЛЯ ЧАТА: КТО И КОГДА УМРЕТ =====================
bot.onText(/\/who_dies/, async (msg) => {
  const chat = msg.chat;

  if (chat.type !== 'group' && chat.type !== 'supergroup') return;

  try {
    const admins = await bot.getChatAdministrators(chat.id);
    const botIsAdmin = admins.some(
      a => a.user.is_bot && a.user.username === BOT_USERNAME
    );

    if (!botIsAdmin) {
      await bot.sendMessage(chat.id, '❌ I must be admin to speak here.');
      return;
    }

    const now = new Date();

    const { rows } = await pool.query(`
      SELECT
        telegram_id,
        username,
        first_name,
        last_name,
        death_timestamp,
        ended
      FROM users
      ORDER BY death_timestamp ASC
    `);

    if (!rows.length) {
      await bot.sendMessage(chat.id, 'No data.');
      return;
    }

    let text = '🩸 *THE ORDER IS ALREADY SET*\n\n';

    for (const u of rows) {
      let name;
      if (u.username) {
        name = `@${u.username}`;
      } else if (u.first_name || u.last_name) {
        name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      } else {
        name = `ID:${u.telegram_id}`;
      }

      const diff = new Date(u.death_timestamp) - now;

      if (u.ended || diff <= 0) {
        text += `💀 *${name}* — *IT HAS ALREADY HAPPENED*\n`;
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        text += `🕰 *${name}* — ${days}d ${hours}h left\n`;
      }
    }

    await bot.sendMessage(chat.id, text, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('who_dies error:', error);
  }
});

// ===================== СТАТИСТИКА =====================
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE death_timestamp > NOW()');
    const endedUsers = await pool.query('SELECT COUNT(*) FROM users WHERE ended = TRUE');
    
    const now = new Date();
    const recentUsers = await pool.query(
      'SELECT COUNT(*) FROM users WHERE created_at > $1',
      [new Date(now.getTime() - 24 * 60 * 60 * 1000)]
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

// ===================== РАССЫЛКА =====================
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

// ===================== TEST =====================
bot.onText(/\/test/, async (msg) => {
  if (!isAdmin(msg)) return;
  await bot.sendMessage(msg.chat.id, '🧪 Bot is alive.', { parse_mode: 'Markdown' });
});

// ===================== USERS =====================
bot.onText(/\/users/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const { rows } = await pool.query(
      'SELECT telegram_id, language, death_timestamp, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    
    let userList = '👥 *LAST 10 USERS*\n\n';
    rows.forEach((user, index) => {
      const timeLeft = Math.floor((new Date(user.death_timestamp) - new Date()) / 86400000);
      userList += `${index + 1}. ID: ${user.telegram_id}\nDays left: ${timeLeft}\n\n`;
    });
    
    await bot.sendMessage(msg.chat.id, userList, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting user list');
  }
});

// ===================== /start =====================
bot.onText(/\/start/, async (msg) => {
  const telegramId = msg.from.id;

  try {
    await pool.query(
      `INSERT INTO users (
        telegram_id,
        language,
        death_timestamp,
        username,
        first_name,
        last_name
      )
       VALUES ($1, $2, NOW() + INTERVAL '1 year', $3, $4, $5)
       ON CONFLICT (telegram_id) DO UPDATE SET
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name`,
      [
        telegramId,
        'EN',
        msg.from.username || null,
        msg.from.first_name || null,
        msg.from.last_name || null
      ]
    );

    await bot.sendMessage(
      telegramId,
      '💀 *COUNTDOWN* 💀\n\n' +
      'YOUR TIME WAS ALWAYS COUNTING.\n' +
      'THE NUMBERS WERE ALREADY THERE.\n\n' +
      '_It was merely revealed._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🩸 REVEAL YOUR FATE 🩸',
              web_app: { url: process.env.APP_URL || 'https://your-app-url.here' }
            }
          ]]
        }
      }
    );
  } catch (err) {
    console.error('BOT START ERROR:', err);
  }
});

// ===================== ГРУППЫ =====================
bot.on('my_chat_member', async (msg) => {
  const chat = msg.chat;
  const status = msg.new_chat_member.status;

  if (
    (chat.type === 'group' || chat.type === 'supergroup') &&
    status === 'administrator'
  ) {
    try {
      await pool.query(
        `INSERT INTO group_chats (chat_id, title)
         VALUES ($1, $2)
         ON CONFLICT (chat_id) DO NOTHING`,
        [chat.id, chat.title || 'unknown']
      );

      await bot.sendMessage(
        chat.id,
        '🩸 *THIS PLACE IS MARKED*\n\nI will speak here.',
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.error('Group insert error:', e);
    }
  }
});

// ===================== ERRORS =====================
bot.on('polling_error', (error) => {
  console.error('POLLING ERROR:', error);
});

bot.on('webhook_error', (error) => {
  console.error('WEBHOOK ERROR:', error);
});

// ===================== EXPORTS FOR WATCHERS =====================
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
