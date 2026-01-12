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

// ===================== ФИКСАЦИЯ УЧАСТНИКОВ ГРУПП =====================
bot.on('message', async (msg) => {
  if (!msg.chat || !msg.from) return;

  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    try {
      // Сохраняем чат
      await pool.query(
        `
        INSERT INTO group_chats (chat_id, title)
        VALUES ($1, $2)
        ON CONFLICT (chat_id) DO NOTHING
        `,
        [msg.chat.id, msg.chat.title || 'Unknown']
      );

      // Сохраняем участника
      await pool.query(
        `
        INSERT INTO group_members (chat_id, telegram_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [msg.chat.id, msg.from.id]
      );
    } catch (e) {
      console.error('Group tracking error:', e);
    }
  }
});

// ===================== НОВАЯ КОМАНДА: /count_help =====================
bot.onText(/\/count_help/, async (msg) => {
  const chat = msg.chat;
  
  try {
    await bot.sendMessage(
      chat.id,
      `🩸 COUNTDOWN HELP\n\n` +
      `*Чтобы появиться в списке смерти:*\n` +
      `1. Нажми /start в ЛС с ботом\n` +
      `2. Нажми "REVEAL YOUR FATE"\n` +
      `3. Прими соглашение и узнай свой срок\n\n` +
      `*Доступные команды в группах:*\n` +
      `/who_dies - Показать порядок смерти всех участников\n` +
      `/count_help - Показать это сообщение\n\n` +
      `*Важно:* Бот должен быть администратором группы\n` +
      `*Мини-приложение:* [Открыть таймер](${process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app/'})`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    );
  } catch (error) {
    console.error('Count help error:', error);
  }
});

// ===================== НОВАЯ КОМАНДА: /setup_group =====================
bot.onText(/\/setup_group/, async (msg) => {
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    return;
  }

  try {
    const admins = await bot.getChatAdministrators(msg.chat.id);
    const userIsAdmin = admins.some(admin => admin.user.id === msg.from.id);
    
    if (!userIsAdmin) {
      await bot.sendMessage(msg.chat.id, '❌ Только администраторы могут настраивать бота.');
      return;
    }

    const botIsAdmin = admins.some(admin => admin.user.username === BOT_USERNAME);
    
    if (!botIsAdmin) {
      await bot.sendMessage(
        msg.chat.id,
        `⚠️ *Сначала сделайте бота администратором!*\n\n` +
        `1. Добавьте @${BOT_USERNAME} в администраторы\n` +
        `2. Дайте права на отправку сообщений\n` +
        `3. Снова отправьте /setup_group`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await pool.query(
      `UPDATE group_chats SET daily_active = TRUE WHERE chat_id = $1`,
      [msg.chat.id]
    );

    await bot.sendMessage(
      msg.chat.id,
      `✅ *Группа настроена!*\n\n` +
      `Теперь бот будет каждый день публиковать список смерти.\n\n` +
      `*Команды:*\n` +
      `/who_dies - показать список сейчас\n` +
      `/count_help - инструкция для участников\n` +
      `/broadcast_group [сообщение] - реклама (только для владельца)`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Setup group error:', error);
  }
});

// ===================== НОВАЯ КОМАНДА: /broadcast_group =====================
bot.onText(/\/broadcast_group (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;

  const message = match[1];
  if (!message) {
    await bot.sendMessage(msg.chat.id, '❌ Usage: /broadcast_group Your message');
    return;
  }

  try {
    const { rows: groups } = await pool.query('SELECT chat_id FROM group_chats');
    let success = 0;
    let failed = 0;

    await bot.sendMessage(msg.chat.id, `📤 Отправка рекламы в ${groups.length} групп...`);

    for (const group of groups) {
      try {
        await bot.sendMessage(
          group.chat_id,
          `📢 РЕКЛАМА: ${message}\n\n` +
          `Отправьте /count_help чтобы узнать больше`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          }
        );
        success++;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        failed++;
        console.error(`Failed to send to group ${group.chat_id}:`, error);
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `✅ РАССЫЛКА ЗАВЕРШЕНА\n\n` +
      `📝 Сообщение: ${message}\n` +
      `✅ Успешно: ${success} групп\n` +
      `❌ Ошибок: ${failed} групп\n` +
      `📊 Всего: ${groups.length} групп`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ Ошибка рассылки: ${error.message}`);
  }
});

// ===================== ОБНОВЛЕННЫЙ /who_dies =====================
bot.onText(/\/who_dies/, async (msg) => {
  const chat = msg.chat;

  if (chat.type !== 'group' && chat.type !== 'supergroup') return;

  try {
    const admins = await bot.getChatAdministrators(chat.id);
    const botIsAdmin = admins.some(
      a => a.user.is_bot && a.user.username === BOT_USERNAME
    );

    if (!botIsAdmin) {
      await bot.sendMessage(chat.id, '❌ Я должен быть администратором, чтобы говорить здесь.');
      return;
    }

    const now = new Date();

    const { rows } = await pool.query(
      `
      SELECT
        u.telegram_id,
        u.username,
        u.first_name,
        u.last_name,
        u.death_timestamp,
        u.ended
      FROM users u
      JOIN group_members gm ON gm.telegram_id = u.telegram_id
      WHERE gm.chat_id = $1
      ORDER BY u.death_timestamp ASC
      `,
      [msg.chat.id]
    );

    if (!rows.length) {
      await bot.sendMessage(
        chat.id,
        `🩸 СПИСОК ПУСТ\n\n` +
        `Никто из участников не открыл свой таймер.\n` +
        `Отправьте /count_help для инструкций.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let text = '🩸 THE ORDER IS ALREADY SET\n\n';

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
        text += `💀 ${name} — УЖЕ ПРОИЗОШЛО\n`;
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        text += `🕰 ${name} — ${days}d ${hours}h осталось\n`;
      }
    }

    text += `\n📌 Отправьте /count_help чтобы появиться в этом списке`;

    await bot.sendMessage(chat.id, text, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('who_dies error:', error);
    try {
      await bot.sendMessage(msg.chat.id, '❌ Ошибка при получении данных. Убедитесь, что бот - администратор.');
    } catch (e) {}
  }
});

// ===================== ОБНОВЛЕННЫЙ /start =====================
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
      '💀 COUNTDOWN 💀\n\n' +
      'YOUR TIME WAS ALWAYS COUNTING.\n' +
      'THE NUMBERS WERE ALREADY THERE.\n\n' +
      '_It was merely revealed._\n\n' +
      '*✨ Доступные команды:*\n' +
      '/help - Показать все команды\n' +
      '/setup_group - Добавить бота в группу\n' +
      '/count_help - Инструкция для групп\n\n' +
      '*🌐 Мини-приложение:* [Открыть таймер](' + (process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app/') + ')',
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🩸 REVEAL YOUR FATE 🩸',
              web_app: { url: process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app' }
            }
          ]]
        }
      }
    );
  } catch (err) {
    console.error('BOT START ERROR:', err);
  }
});

// ===================== НОВАЯ КОМАНДА: /help =====================
bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `🩸 COUNTDOWN BOT HELP\n\n` +
    `*Основные команды:*\n` +
    `/start - Начать работу с ботом\n` +
    `/help - Показать это сообщение\n\n` +
    `*Для групп:*\n` +
    `/setup_group - Настроить бота в группе (только админы)\n` +
    `/count_help - Инструкция для участников групп\n\n` +
    `*Для администратора:*\n` +
    `/admin - Панель администратора\n` +
    `/stats - Статистика\n` +
    `/broadcast [сообщение] - Рассылка всем пользователям\n` +
    `/broadcast_group [сообщение] - Рассылка во все группы\n\n` +
    `*Мини-приложение:* [Открыть таймер](${process.env.APP_URL || 'https://philosophical-cari-eriksim-0bb1de46.koyeb.app/'})\n` +
    `*Поддержка:* @smknnnn`,
    {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    }
  );
});

// ===================== ОБНОВЛЕННАЯ /admin КОМАНДА =====================
bot.onText(/\/admin/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  await bot.sendMessage(
    msg.chat.id,
    `🕳 ADMIN PANEL\n\n` +
    `User ID: ${msg.from.id}\n` +
    `Username: @${msg.from.username || 'none'}\n` +
    `Status: 🔒 ADMIN\n\n` +
    `*Available commands:*\n` +
    `/stats - Show statistics\n` +
    `/broadcast [message] - Send message to all users\n` +
    `/broadcast_group [message] - Send message to all groups\n` +
    `/test - Test message to yourself\n` +
    `/users - List all users\n` +
    `/groups - List all groups`,
    { parse_mode: 'Markdown' }
  );
});

// ===================== НОВАЯ КОМАНДА: /groups =====================
bot.onText(/\/groups/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const { rows } = await pool.query(
      'SELECT chat_id, title, added_at, daily_active FROM group_chats ORDER BY added_at DESC LIMIT 20'
    );
    
    let groupsList = '👥 LAST 20 GROUPS\n\n';
    rows.forEach((group, index) => {
      const date = new Date(group.added_at).toLocaleDateString();
      const active = group.daily_active ? '✅' : '❌';
      groupsList += `${index + 1}. ${group.title || 'Unknown'}\n`;
      groupsList += `ID: ${group.chat_id}\n`;
      groupsList += `Added: ${date}\n`;
      groupsList += `Daily: ${active}\n\n`;
    });
    
    await bot.sendMessage(msg.chat.id, groupsList, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting groups list');
  }
});

// ===================== ОБРАБОТКА ДОБАВЛЕНИЯ БОТА В ГРУППУ =====================
bot.on('my_chat_member', async (msg) => {
  const chat = msg.chat;
  const status = msg.new_chat_member.status;

  if ((chat.type === 'group' || chat.type === 'supergroup') && status === 'administrator') {
    try {
      await pool.query(
        `INSERT INTO group_chats (chat_id, title, daily_active)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (chat_id) DO UPDATE SET
           title = EXCLUDED.title,
           daily_active = TRUE`,
        [chat.id, chat.title || 'unknown']
      );

      await bot.sendMessage(
        chat.id,
        '🩸 THIS PLACE IS MARKED\n\n' +
        'I will speak here every day.\n\n' +
        '*Commands:*\n' +
        '/who_dies - Show death list\n' +
        '/count_help - Instructions for members\n' +
        '/setup_group - Configure bot settings\n\n' +
        '_Send /count_help to see how to appear in the list_',
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.error('Group insert error:', e);
    }
  }
});

// ===================== ОСТАВШИЕСЯ КОМАНДЫ (без изменений) =====================
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE death_timestamp > NOW()');
    const endedUsers = await pool.query('SELECT COUNT(*) FROM users WHERE ended = TRUE');
    const groupsCount = await pool.query('SELECT COUNT(*) FROM group_chats');
    
    const now = new Date();
    const recentUsers = await pool.query(
      'SELECT COUNT(*) FROM users WHERE created_at > $1',
      [new Date(now.getTime() - 24 * 60 * 60 * 1000)]
    );
    
    await bot.sendMessage(
      msg.chat.id,
      `📊 STATISTICS\n\n` +
      `👥 Total users: ${totalUsers.rows[0].count}\n` +
      `⏳ Active countdowns: ${activeUsers.rows[0].count}\n` +
      `💀 Finished countdowns: ${endedUsers.rows[0].count}\n` +
      `👥 Groups: ${groupsCount.rows[0].count}\n` +
      `🆕 Last 24h: ${recentUsers.rows[0].count}\n` +
      `🕒 Server time: ${now.toISOString()}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting statistics');
  }
});

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
        await bot.sendMessage(user.telegram_id, `📢 BROADCAST: ${message}`, {
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
      `✅ BROADCAST COMPLETE\n\n` +
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

bot.onText(/\/test/, async (msg) => {
  if (!isAdmin(msg)) return;
  await bot.sendMessage(msg.chat.id, '🧪 Bot is alive.', { parse_mode: 'Markdown' });
});

bot.onText(/\/users/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const { rows } = await pool.query(
      'SELECT telegram_id, language, death_timestamp, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    
    let userList = '👥 LAST 10 USERS\n\n';
    rows.forEach((user, index) => {
      const timeLeft = Math.floor((new Date(user.death_timestamp) - new Date()) / 86400000);
      userList += `${index + 1}. ID: ${user.telegram_id}\nDays left: ${timeLeft}\n\n`;
    });
    
    await bot.sendMessage(msg.chat.id, userList, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting user list');
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
      `👻 IT SPEAKS\n\n${message}`,
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
      `⚠️ WARNING\n\n${message}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Failed to send warning message:', error);
  }
}

console.log('🤖 COUNTDOWN BOT STARTED SUCCESSFULLY');
console.log(`🔐 ADMIN ID: ${ADMIN_ID}`);
console.log(`🔐 ADMIN USERNAME: ${ADMIN_USERNAME}`);
