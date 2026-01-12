import { pool } from './db.js';
import { bot } from './bot.js';
import { POST_END } from './post_end_phrases.js';
import { PHRASES_7D, PHRASES_24H, PHRASES_RU_7D, PHRASES_RU_24H } from './phrases.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Экранирование для MarkdownV2
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// Форматирование времени
function formatTime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ===================== ДОБАВЛЕНО: ОТОБРАЖЕНИЕ ИМЕНИ =====================
function displayName(user) {
  if (user.username) return `@${user.username}`;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return `ID:${user.telegram_id}`;
}

// Получение фразы по языку и оставшемуся времени
function getPhraseByTimeAndLanguage(language, secondsLeft) {
  if (secondsLeft <= 0) {
    return language === 'RU' 
      ? random(['ОН УЖЕ ПРИШЕЛ', 'КОНЕЦ НАСТУПИЛ', 'ВРЕМЯ ВЫШЛО'])
      : random(['IT HAS ARRIVED', 'THE END HAS COME', 'TIME IS UP']);
  }
  
  if (secondsLeft <= 86400) { // 24 часа
    return language === 'RU' ? random(PHRASES_RU_24H) : random(PHRASES_24H);
  }
  
  if (secondsLeft <= 7 * 86400) { // 7 дней
    return language === 'RU' ? random(PHRASES_RU_7D) : random(PHRASES_7D);
  }
  
  return language === 'RU'
    ? random(['ВРЕМЯ ИДЕТ', 'ОТСЧЕТ ПРОДОЛЖАЕТСЯ', 'ОН ЖДЕТ'])
    : random(['TIME PASSES', 'COUNTDOWN CONTINUES', 'IT WAITS']);
}

// Основная функция проверки групп
async function checkGroups() {
  const now = new Date();

  try {
    // Получаем все группы из базы
    const groups = await pool.query(`SELECT chat_id, title FROM group_chats`);

    if (groups.rows.length === 0) {
      console.log('👥 No groups to monitor');
      return;
    }

    console.log(`👥 Checking ${groups.rows.length} groups...`);

    for (const group of groups.rows) {
      try {
        // Проверяем админские права бота в группе
        let botIsAdmin = true;
        try {
          const admins = await bot.getChatAdministrators(group.chat_id);
          botIsAdmin = admins.some(
            admin => admin.user.is_bot && admin.user.username === (await bot.getMe()).username
          );
        } catch (adminError) {
          console.error(`Can't get admins for group ${group.chat_id}:`, adminError.message);
          botIsAdmin = false;
        }

        if (!botIsAdmin) {
          console.log(`❌ Bot is not admin in group ${group.chat_id}`);
          continue;
        }

        // Получаем участников группы из базы
        const users = await pool.query(`
          SELECT
            u.telegram_id,
            u.username,
            u.first_name,
            u.last_name,
            u.death_timestamp,
            u.ended,
            u.language
          FROM users u
          JOIN group_members gm ON u.telegram_id = gm.telegram_id
          WHERE gm.chat_id = $1
          ORDER BY u.death_timestamp ASC
          LIMIT 50
        `, [group.chat_id]);

        if (!users.rows.length) {
          console.log(`👻 No members found for group ${group.chat_id}`);
          continue;
        }

        console.log(`📊 Group ${group.chat_id}: ${users.rows.length} members`);

        // Отправляем одно сообщение для всей группы
        let groupMessage = '🩸 *THE ORDER IS ALREADY SET*' + `\n\n`;

        for (const u of users.rows) {
          const diff = new Date(u.death_timestamp) - now;
          const sec = Math.floor(diff / 1000);
          const name = displayName(u);
          const escapedName = escapeMarkdown(name);

          if (u.ended || sec <= 0) {
            const phrase = getPhraseByTimeAndLanguage(u.language || 'EN', sec);
            groupMessage += `💀 *${escapedName}* \\- ${phrase}` + `\n`;
          } else {
            const phrase = getPhraseByTimeAndLanguage(u.language || 'EN', sec);
            groupMessage += `🕰 *${escapedName}* \\- ${formatTime(sec)} \\- ${phrase}` + `\n`;
          }
        }

        // Добавляем инструкцию внизу
        groupMessage += `\n*Use /who\\_dies to update*`;

        try {
          await bot.sendMessage(group.chat_id, groupMessage, {
            parse_mode: 'MarkdownV2'
          });
          
          console.log(`✅ Message sent to group ${group.chat_id}`);
          
          // Задержка между сообщениями в группах
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (sendError) {
          console.error(`Failed to send message to group ${group.chat_id}:`, sendError.message);
          
          // Если бота выгнали из группы, удаляем её из базы
          if (sendError.response?.error_code === 403) {
            console.log(`🚫 Bot was removed from group ${group.chat_id}, removing from database`);
            await pool.query(
              'DELETE FROM group_chats WHERE chat_id = $1',
              [group.chat_id]
            );
          }
        }

      } catch (groupError) {
        console.error(`Error processing group ${group.chat_id}:`, groupError);
      }
    }

  } catch (error) {
    console.error('Group watcher database error:', error);
  }
}

// Функция для отправки тестового сообщения в группу
export async function sendTestGroupMessage(chatId) {
  try {
    const now = new Date();
    
    const users = await pool.query(`
      SELECT
        u.telegram_id,
        u.username,
        u.first_name,
        u.last_name,
        u.death_timestamp,
        u.ended,
        u.language
      FROM users u
      JOIN group_members gm ON u.telegram_id = gm.telegram_id
      WHERE gm.chat_id = $1
      ORDER BY u.death_timestamp ASC
      LIMIT 10
    `, [chatId]);

    if (!users.rows.length) {
      await bot.sendMessage(
        chatId,
        '👻 *TEST MESSAGE*' + `\n\n` + 'No users found in this group\\.',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let testMessage = '🩸 *TEST GROUP MESSAGE*' + `\n\n`;

    for (const u of users.rows.slice(0, 5)) {
      const diff = new Date(u.death_timestamp) - now;
      const sec = Math.floor(diff / 1000);
      const name = displayName(u);
      const escapedName = escapeMarkdown(name);

      testMessage += `👤 *${escapedName}* \\- ${formatTime(sec)} left` + `\n`;
    }

    testMessage += `\n*This is a test message*\\.`;

    await bot.sendMessage(chatId, testMessage, {
      parse_mode: 'MarkdownV2'
    });

    console.log(`✅ Test message sent to group ${chatId}`);

  } catch (error) {
    console.error('Test group message error:', error);
  }
}

// Функция для принудительной проверки всех групп
export async function forceCheckAllGroups() {
  try {
    const groups = await pool.query(`SELECT chat_id, title FROM group_chats`);
    console.log(`📢 Force checking ${groups.rows.length} groups...`);

    let success = 0;
    let failed = 0;

    for (const group of groups.rows) {
      try {
        await checkGroups(); // Используем основную функцию
        success++;
      } catch (error) {
        failed++;
        console.error(`Failed to check group ${group.chat_id}:`, error.message);
      }
    }

    console.log(`✅ Force check completed: ${success} success, ${failed} failed`);
    return { success, failed };

  } catch (error) {
    console.error('Force check groups error:', error);
    return { success: 0, failed: 0 };
  }
}

// Проверка групп раз в сутки
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа

console.log('👥 GROUP WATCHER STARTED - Checking every 24 hours');

// Первая проверка через 30 секунд после запуска
setTimeout(() => {
  checkGroups();
  console.log('🔍 Initial group check completed');
}, 30000);

// Периодическая проверка
setInterval(checkGroups, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Stopping group watcher...');
  process.exit(0);
});

export { checkGroups };
