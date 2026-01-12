import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN;
const ADMIN_ID = 647773442;
const ADMIN_USERNAME = 'smknnnn';
const groupSeenUsers = new Map();

export const bot = new TelegramBot(token, { polling: true });

let BOT_USERNAME = null;
bot.getMe().then(me => {
  BOT_USERNAME = me.username;
});

// Проверка админских прав
function isAdmin(msg) {
  return msg.from.id === ADMIN_ID || msg.from.username === ADMIN_USERNAME;
}

// Экранирование для MarkdownV2
function escapeMarkdown(text) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// ===================== ФИКСАЦИЯ УЧАСТНИКОВ ГРУПП =====================
bot.on('message', async (msg) => {
  if (!msg.chat || !msg.from) return;

  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    try {
      await pool.query(
        `INSERT INTO group_members (chat_id, telegram_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [msg.chat.id, msg.from.id]
      );
    } catch (e) {
      console.error('group_members insert error:', e);
    }
  }
});

bot.on('message', (msg) => {
  if (!msg.chat || !msg.from) return;
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;

  if (!groupSeenUsers.has(msg.chat.id)) {
    groupSeenUsers.set(msg.chat.id, new Set());
  }

  groupSeenUsers.get(msg.chat.id).add(msg.from.id);
});

// ===================== НАСТРОЙКА МЕНЮ БОТА =====================
bot.setMyCommands([
  {
    command: 'start',
    description: '🩸 Узнать свой отсчёт'
  },
  {
    command: 'coun_help',
    description: '💀 Добавить бота в группу'
  }
], { scope: { type: 'default' } });

// ===================== /start КОМАНДА =====================
bot.onText(/\/start/, async (msg) => {
  const telegramId = msg.from.id;

  try {
    // Сохраняем/обновляем пользователя
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

    // Отправляем стильное сообщение
    await bot.sendMessage(
      telegramId,
      `💀 *COUNTDOWN* 💀` + `\n\n` +
      `YOUR TIME WAS ALWAYS COUNTING\\.` + `\n` +
      `THE NUMBERS WERE ALREADY THERE\\.` + `\n\n` +
      `_It was merely revealed_\\.`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🩸 REVEAL YOUR FATE 🩸',
              web_app: { url: process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app/' }
            }
          ]]
        }
      }
    );
  } catch (err) {
    console.error('BOT START ERROR:', err);
    await bot.sendMessage(
      telegramId,
      '⚠️ Error occurred\\. Please try again\\.',
      { parse_mode: 'MarkdownV2' }
    );
  }
});

// ===================== КОМАНДА coun_help =====================
bot.onText(/\/coun_help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `👻 *HOW TO JOIN THE COUNTDOWN*` + `\n\n` +
    `*1\\. Add the bot to your group:*` + `\n` +
    `Add @countdown\\_horror\\_bot to your group` + `\n\n` +
    `*2\\. Grant administrator rights:*` + `\n` +
    `Give the bot administrator privileges with permission to post messages` + `\n\n` +
    `*3\\. Accept the terms:*` + `\n` +
    `Each user must send /start to the bot and accept the agreement in the mini\\-app` + `\n\n` +
    `*4\\. The countdown begins:*` + `\n` +
    `Your time will be added to the group\\'s daily message` + `\n\n` +
    `🩸 *THE AGREEMENT AWAITS*` + `\n` +
    `_Accept your fate and join the countdown_\\.`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🩸 START YOUR COUNTDOWN',
            web_app: { url: process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app/' }
          }
        ]]
      }
    }
  );
});

// ===================== КОМАНДА ДЛЯ ГРУППЫ =====================
bot.onText(/\/who_dies/, async (msg) => {
  const chat = msg.chat;

  if (chat.type !== 'group' && chat.type !== 'supergroup') {
    await bot.sendMessage(
      chat.id,
      '⚠️ This command works only in groups\\. Use /coun\\_help for instructions\\.',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  try {
    // Проверяем админские права бота
    const admins = await bot.getChatAdministrators(chat.id);
    const botIsAdmin = admins.some(
      a => a.user.is_bot && a.user.username === BOT_USERNAME
    );

    if (!botIsAdmin) {
      await bot.sendMessage(
        chat.id,
        '❌ *I must be admin to speak here*' + `\n\n` +
        '*Add me as administrator with:*' + `\n` +
        '• Post messages permission' + `\n` +
        '• Read messages permission' + `\n\n` +
        '_Use /coun\\_help for detailed instructions_\\.',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const now = new Date();

    // Получаем участников группы из базы
    const { rows } = await pool.query(
      `SELECT
        u.telegram_id,
        u.username,
        u.first_name,
        u.last_name,
        u.death_timestamp,
        u.ended
       FROM users u
       JOIN group_members gm ON u.telegram_id = gm.telegram_id
       WHERE gm.chat_id = $1
       ORDER BY u.death_timestamp ASC`,
      [msg.chat.id]
    );

    if (!rows.length) {
      await bot.sendMessage(
        chat.id,
        '👻 *NOBODY HAS ACCEPTED THEIR FATE YET*' + `\n\n` +
        '*To appear in this list:*' + `\n` +
        '1\\. Send /start to @countdown\\_horror\\_bot' + `\n` +
        '2\\. Accept the agreement in mini\\-app' + `\n` +
        '3\\. Your countdown will appear here' + `\n\n` +
        '_The numbers await your acceptance_\\.',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let text = '🩸 *THE ORDER IS ALREADY SET*' + `\n\n`;

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
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);

      if (u.ended || diff <= 0) {
        text += `💀 *${escapeMarkdown(name)}* \\- *IT HAS ALREADY HAPPENED*` + `\n`;
      } else {
        text += `🕰 *${escapeMarkdown(name)}* \\- ${days}d ${hours}h left` + `\n`;
      }
    }

    text += `\n*Send /coun\\_help to join this list*`;

    await bot.sendMessage(chat.id, text, { parse_mode: 'MarkdownV2' });

  } catch (error) {
    console.error('who_dies error:', error);
    await bot.sendMessage(
      msg.chat.id,
      '❌ Error occurred\\. Please try again\\.',
      { parse_mode: 'MarkdownV2' }
    );
  }
});

// ===================== АДМИН КОМАНДЫ (скрытые) =====================

// Команда для проверки админских прав
bot.onText(/\/admin/, async (msg) => {
  if (!isAdmin(msg)) {
    await bot.sendMessage(
      msg.chat.id,
      '🚫 *Access Denied*',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }
  
  await bot.sendMessage(
    msg.chat.id,
    `🕳 *ADMIN PANEL*` + `\n\n` +
    `User ID: ${msg.from.id}` + `\n` +
    `Username: @${escapeMarkdown(msg.from.username || 'none')}` + `\n` +
    `Status: 🔒 ADMIN` + `\n\n` +
    `*Available commands:*` + `\n` +
    `• /stats \\- Show statistics` + `\n` +
    `• /broadcast \\[message\\] \\- Send message to all users` + `\n` +
    `• /test \\- Test message to yourself` + `\n` +
    `• /users \\- List all users`,
    { parse_mode: 'MarkdownV2' }
  );
});

// ===================== СТАТИСТИКА =====================
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) {
    await bot.sendMessage(
      msg.chat.id,
      '🚫 *Access Denied*',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

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
      `📊 *STATISTICS*` + `\n\n` +
      `👥 Total users: ${totalUsers.rows[0].count}` + `\n` +
      `⏳ Active countdowns: ${activeUsers.rows[0].count}` + `\n` +
      `💀 Finished countdowns: ${endedUsers.rows[0].count}` + `\n` +
      `🆕 Last 24h: ${recentUsers.rows[0].count}` + `\n` +
      `🕒 Server time: ${now.toISOString()}`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (error) {
    await bot.sendMessage(
      msg.chat.id,
      '❌ Error getting statistics',
      { parse_mode: 'MarkdownV2' }
    );
  }
});

// ===================== РАССЫЛКА =====================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) {
    await bot.sendMessage(
      msg.chat.id,
      '🚫 *Access Denied*',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  const message = match[1];
  if (!message) {
    await bot.sendMessage(
      msg.chat.id,
      '❌ Usage: /broadcast Your message here',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  try {
    const { rows } = await pool.query('SELECT telegram_id FROM users');
    let success = 0;
    let failed = 0;

    await bot.sendMessage(
      msg.chat.id,
      `📤 Starting broadcast to ${rows.length} users\\.\\.\\\\.`,
      { parse_mode: 'MarkdownV2' }
    );

    for (const user of rows) {
      try {
        await bot.sendMessage(
          user.telegram_id,
          `📢 *BROADCAST:* ${escapeMarkdown(message)}`,
          { parse_mode: 'MarkdownV2' }
        );
        success++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `✅ *BROADCAST COMPLETE*` + `\n\n` +
      `📝 Message: ${escapeMarkdown(message)}` + `\n` +
      `✅ Success: ${success} users` + `\n` +
      `❌ Failed: ${failed} users` + `\n` +
      `📊 Total: ${rows.length} users`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (error) {
    await bot.sendMessage(
      msg.chat.id,
      `❌ Broadcast error: ${escapeMarkdown(error.message)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
});

// ===================== TEST =====================
bot.onText(/\/test/, async (msg) => {
  if (!isAdmin(msg)) {
    await bot.sendMessage(
      msg.chat.id,
      '🚫 *Access Denied*',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }
  await bot.sendMessage(
    msg.chat.id,
    '🧪 Bot is alive\\!',
    { parse_mode: 'MarkdownV2' }
  );
});

// ===================== USERS =====================
bot.onText(/\/users/, async (msg) => {
  if (!isAdmin(msg)) {
    await bot.sendMessage(
      msg.chat.id,
      '🚫 *Access Denied*',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT telegram_id, language, death_timestamp, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    
    let userList = '👥 *LAST 10 USERS*' + `\n\n`;
    rows.forEach((user, index) => {
      const timeLeft = Math.floor((new Date(user.death_timestamp) - new Date()) / 86400000);
      userList += `${index + 1}\\. ID: ${user.telegram_id}` + `\n` +
                 `Days left: ${timeLeft}` + `\n\n`;
    });
    
    await bot.sendMessage(msg.chat.id, userList, { parse_mode: 'MarkdownV2' });
  } catch (error) {
    await bot.sendMessage(
      msg.chat.id,
      '❌ Error getting user list',
      { parse_mode: 'MarkdownV2' }
    );
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
      // Создаем таблицу если её нет
      await pool.query(`
        CREATE TABLE IF NOT EXISTS group_chats (
          chat_id BIGINT PRIMARY KEY,
          title TEXT,
          added_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await pool.query(
        `INSERT INTO group_chats (chat_id, title)
         VALUES ($1, $2)
         ON CONFLICT (chat_id) DO UPDATE SET title = EXCLUDED.title`,
        [chat.id, chat.title || 'unknown']
      );

      await bot.sendMessage(
        chat.id,
        '🩸 *THIS PLACE IS NOW MARKED*' + `\n\n` +
        'I will speak here daily with the countdown order\\.' + `\n\n` +
        '*Use /who\\_dies to see the current order*' + `\n` +
        '*Use /coun\\_help for instructions*' + `\n\n` +
        '_The countdown begins for all who accept_\\.',
        { parse_mode: 'MarkdownV2' }
      );
    } catch (e) {
      console.error('Group insert error:', e);
    }
  }
});

// ===================== ЕЖЕДНЕВНОЕ СООБЩЕНИЕ В ГРУППАХ =====================
async function sendDailyGroupMessage(chatId) {
  try {
    const now = new Date();
    const { rows } = await pool.query(
      `SELECT
        u.telegram_id,
        u.username,
        u.first_name,
        u.last_name,
        u.death_timestamp,
        u.ended
       FROM users u
       JOIN group_members gm ON u.telegram_id = gm.telegram_id
       WHERE gm.chat_id = $1
       ORDER BY u.death_timestamp ASC`,
      [chatId]
    );

    if (!rows.length) return;

    let message = '🩸 *THE ORDER IS ALREADY SET*' + `\n\n`;

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
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);

      if (u.ended || diff <= 0) {
        message += `💀 *${escapeMarkdown(name)}* \\- *IT HAS ALREADY HAPPENED*` + `\n`;
      } else {
        message += `🕰 *${escapeMarkdown(name)}* \\- ${days}d ${hours}h left` + `\n`;
      }
    }

    message += `\n*Send /coun\\_help to join this list*`;

    await bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    console.error('Daily group message error:', error);
  }
}

// Запускаем ежедневные сообщения
setInterval(async () => {
  try {
    const { rows } = await pool.query('SELECT chat_id FROM group_chats');
    for (const row of rows) {
      await sendDailyGroupMessage(row.chat_id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка между группами
    }
  } catch (error) {
    console.error('Daily messages error:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 часа

// ===================== ERRORS =====================
bot.on('polling_error', (error) => {
  console.error('POLLING ERROR:', error);
});

bot.on('webhook_error', (error) => {
  console.error('WEBHOOK ERROR:', error);
});

console.log('🤖 COUNTDOWN BOT STARTED SUCCESSFULLY');
console.log(`🔐 ADMIN ID: ${ADMIN_ID}`);
console.log(`🔐 ADMIN USERNAME: ${ADMIN_USERNAME}`);
