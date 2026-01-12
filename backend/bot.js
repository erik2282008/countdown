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
  console.log(`🤖 Bot started as @${BOT_USERNAME}`);
});

// Проверка админских прав
function isAdmin(msg) {
  return msg.from.id === ADMIN_ID || msg.from.username === ADMIN_USERNAME;
}

// Экранирование для MarkdownV2
function escapeMarkdown(text) {
  if (!text) return '';
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
// В МЕНЮ ТОЛЬКО 2 КОМАНДЫ!
bot.setMyCommands([
  {
    command: 'start',
    description: '🩸 Узнать свой отсчёт'
  },
  {
    command: 'group_help',
    description: '💀 Добавить бота в группу'
  }
], { scope: { type: 'default' } });

// Админские команды только для админа (скрытые)
bot.setMyCommands([
  {
    command: 'start',
    description: '🩸 Узнать свой отсчёт'
  },
  {
    command: 'group_help',
    description: '💀 Добавить бота в группу'
  },
  {
    command: 'admin',
    description: '👁‍🗨 Админ панель'
  },
  {
    command: 'stats',
    description: '📊 Статистика'
  },
  {
    command: 'broadcast',
    description: '📢 Рассылка'
  },
  {
    command: 'users',
    description: '👥 Список пользователей'
  }
], { scope: { type: 'chat', chat_id: ADMIN_ID } });

// ===================== /start КОМАНДА =====================
bot.onText(/\/start(@countdown_horror_bot)?$/, async (msg) => {
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

// ===================== /coun_help КОМАНДА =====================
bot.onText(/\/coun_help(@countdown_horror_bot)?$/, async (msg) => {
  // КОМАНДА РАБОТАЕТ В ЛЮБОМ ЧАТЕ - И В ГРУППАХ И В ЛИЧКЕ
  await bot.sendMessage(
    msg.chat.id,
    `👻 *HOW TO APPEAR IN THE COUNTDOWN LIST*` + `\n\n` +
    `*TO SEE YOUR TIME IN THE GROUP LIST, YOU MUST:*` + `\n\n` +
    `1\\. *START YOUR COUNTDOWN* \\- Send /start to @countdown\\_horror\\_bot` + `\n` +
    `2\\. *FACE THE AGREEMENT* \\- Click the button below and open the mini\\-app` + `\n` +
    `3\\. *ACCEPT YOUR FATE* \\- Read and accept the irrevocable terms` + `\n` +
    `4\\. *YOUR TIME IS REVEALED* \\- Your countdown will appear in the daily group message` + `\n\n` +
    `⚠️ *WARNING* \\- The agreement is absolute and cannot be revoked\\.` + `\n` +
    `🩸 *YOUR TIME WAS ALWAYS COUNTING* \\- You just didn\\'t know it\\.` + `\n\n` +
    `_Do not look away\\. The numbers await your acceptance\\._`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🩸 ACCEPT YOUR FATE NOW',
            web_app: { url: process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app/' }
          }
        ]]
      }
    }
  );
});

// ===================== /group_help КОМАНДА =====================
bot.onText(/\/group_help(@countdown_horror_bot)?$/, async (msg) => {
  // КОМАНДА РАБОТАЕТ В ЛЮБОМ ЧАТЕ
  await bot.sendMessage(
    msg.chat.id,
    `🔮 *HOW TO ADD THE COUNTDOWN TO YOUR GROUP*` + `\n\n` +
    `*TO SEE THE COUNTDOWN IN YOUR GROUP:*` + `\n\n` +
    `1\\. *ADD THE BEARER OF FATE* \\- Add @countdown\\_horror\\_bot to your group` + `\n` +
    `2\\. *GRANT IT VOICE* \\- Make the bot an administrator with post message permissions` + `\n` +
    `3\\. *THE COUNTDOWN BEGINS* \\- The bot will post daily updates of everyone\\'s time` + `\n` +
    `4\\. *MEMBERS JOIN THE LIST* \\- They use /coun\\_help to start their countdown` + `\n\n` +
    `👻 *EACH DAY THE ORDER IS REVEALED*` + `\n` +
    `_Who goes first, who goes last\\- the countdown speaks the truth\\._` + `\n\n` +
    `💀 *THE NUMBERS DO NOT LIE*` + `\n` +
    `_Time was always counting\\- now you get to see it\\._`,
    { parse_mode: 'MarkdownV2' }
  );
});

// ===================== /who_dies КОМАНДА ДЛЯ ГРУПП =====================
bot.onText(/\/who_dies(@countdown_horror_bot)?$/, async (msg) => {
  const chat = msg.chat;

  if (chat.type !== 'group' && chat.type !== 'supergroup') {
    await bot.sendMessage(
      chat.id,
      '⚠️ This command works only in groups\\. Use /group\\_help for instructions\\.',
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
        '_Use /group\\_help for detailed instructions_\\.',
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
        '_The numbers await your acceptance\\._',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // СООБЩЕНИЕ В ФОРМАТЕ КАК ПРОСИЛИ!
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

    // ТОЧНО КАК ПРОСИЛИ!
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

bot.onText(/\/admin(@countdown_horror_bot)?$/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  await bot.sendMessage(
    msg.chat.id,
    `🕳 *ADMIN PANEL*` + `\n\n` +
    `User ID: ${msg.from.id}` + `\n` +
    `Username: @${escapeMarkdown(msg.from.username || 'none')}` + `\n` +
    `Status: 🔒 ADMIN` + `\n\n` +
    `*Commands:*` + `\n` +
    `/stats \\- Show statistics` + `\n` +
    `/broadcast \\[message\\] \\- Send to all users` + `\n` +
    `/test \\- Test message` + `\n` +
    `/users \\- List users`,
    { parse_mode: 'MarkdownV2' }
  );
});

bot.onText(/\/stats(@countdown_horror_bot)?$/, async (msg) => {
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
      `📊 *STATISTICS*` + `\n\n` +
      `👥 Total users: ${totalUsers.rows[0].count}` + `\n` +
      `⏳ Active countdowns: ${activeUsers.rows[0].count}` + `\n` +
      `💀 Finished countdowns: ${endedUsers.rows[0].count}` + `\n` +
      `🆕 Last 24h: ${recentUsers.rows[0].count}` + `\n` +
      `🕒 Server time: ${now.toISOString()}`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (error) {
    console.error('Stats error:', error);
  }
});

bot.onText(/\/broadcast(@countdown_horror_bot)? (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;

  const message = match[2];
  if (!message) return;

  try {
    const { rows } = await pool.query('SELECT telegram_id FROM users');
    let success = 0;
    let failed = 0;

    for (const user of rows) {
      try {
        await bot.sendMessage(user.telegram_id, `📢 ${escapeMarkdown(message)}`, {
          parse_mode: 'MarkdownV2'
        });
        success++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `📢 Broadcast: ${success} success, ${failed} failed`
    );
  } catch (error) {
    console.error('Broadcast error:', error);
  }
});

bot.onText(/\/test(@countdown_horror_bot)?$/, async (msg) => {
  if (!isAdmin(msg)) return;
  await bot.sendMessage(msg.chat.id, '🧪 Bot is working!');
});

bot.onText(/\/users(@countdown_horror_bot)?$/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const { rows } = await pool.query(
      'SELECT telegram_id, death_timestamp FROM users ORDER BY created_at DESC LIMIT 10'
    );
    
    let userList = '👥 *Last 10 users:*' + `\n\n`;
    rows.forEach((user, index) => {
      const days = Math.floor((new Date(user.death_timestamp) - new Date()) / 86400000);
      userList += `${index + 1}\\. ${user.telegram_id} \\- ${days}d left` + `\n`;
    });
    
    await bot.sendMessage(msg.chat.id, userList, { parse_mode: 'MarkdownV2' });
  } catch (error) {
    console.error('Users error:', error);
  }
});

// ===================== ГРУППЫ =====================
bot.on('my_chat_member', async (msg) => {
  const chat = msg.chat;
  const status = msg.new_chat_member.status;

  if ((chat.type === 'group' || chat.type === 'supergroup') && status === 'administrator') {
    try {
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
        '*Use /coun\\_help to join the list*' + `\n\n` +
        '_The countdown begins for all who accept_\\.',
        { parse_mode: 'MarkdownV2' }
      );
    } catch (e) {
      console.error('Group insert error:', e);
    }
  }
});

// ===================== ЕЖЕДНЕВНОЕ СООБЩЕНИЕ В ГРУППАХ =====================
async function sendDailyGroupMessages() {
  try {
    const { rows } = await pool.query('SELECT chat_id FROM group_chats');
    const now = new Date();

    for (const row of rows) {
      try {
        const users = await pool.query(
          `SELECT
            u.telegram_id,
            u.username,
            u.death_timestamp,
            u.ended
           FROM users u
           JOIN group_members gm ON u.telegram_id = gm.telegram_id
           WHERE gm.chat_id = $1
           ORDER BY u.death_timestamp ASC`,
          [row.chat_id]
        );

        if (!users.rows.length) continue;

        // ТОЧНО КАК ПРОСИЛИ - ФОРМАТ СООБЩЕНИЯ!
        let message = '🩸 *THE ORDER IS ALREADY SET*' + `\n\n`;

        for (const u of users.rows) {
          let name = u.username ? `@${u.username}` : `ID:${u.telegram_id}`;
          const diff = new Date(u.death_timestamp) - now;
          const days = Math.floor(diff / 86400000);
          const hours = Math.floor((diff % 86400000) / 3600000);

          if (u.ended || diff <= 0) {
            message += `💀 *${escapeMarkdown(name)}* \\- *IT HAS ALREADY HAPPENED*` + `\n`;
          } else {
            message += `🕰 *${escapeMarkdown(name)}* \\- ${days}d ${hours}h left` + `\n`;
          }
        }

        // ТОЧНО КАК ПРОСИЛИ!
        message += `\n*Send /coun\\_help to join this list*`;

        await bot.sendMessage(row.chat_id, message, { parse_mode: 'MarkdownV2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Daily message to ${row.chat_id} error:`, error);
      }
    }
  } catch (error) {
    console.error('Daily messages error:', error);
  }
}

// Запускаем ежедневные сообщения (раз в 24 часа)
setInterval(sendDailyGroupMessages, 24 * 60 * 60 * 1000);

// Первое сообщение через 10 секунд после запуска
setTimeout(sendDailyGroupMessages, 10000);

// ===================== ОБРАБОТКА ОШИБОК =====================
bot.on('polling_error', (error) => {
  console.error('POLLING ERROR:', error);
});

bot.on('webhook_error', (error) => {
  console.error('WEBHOOK ERROR:', error);
});

console.log('🤖 COUNTDOWN BOT STARTED SUCCESSFULLY');
console.log(`🔐 ADMIN ID: ${ADMIN_ID}`);
console.log(`🔐 ADMIN USERNAME: ${ADMIN_USERNAME}`);
console.log(`📱 APP URL: ${process.env.APP_URL}`);
