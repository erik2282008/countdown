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

// ===================== ОТОБРАЖЕНИЕ ИМЕНИ =====================
function displayName(user) {
  if (user.username) return `@${user.username}`;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${u.last_name || ''}`.trim();
  }
  return `ID:${user.telegram_id}`;
}

// Получение страшной фразы по языку и оставшемуся времени
function getHorrorPhrase(language, secondsLeft) {
  if (secondsLeft <= 0) {
    return language === 'RU' 
      ? random(['ОН УЖЕ ПРИШЕЛ', 'КОНЕЦ НАСТУПИЛ', 'ВРЕМЯ ВЫШЛО', 'ЭТО СЛУЧИЛОСЬ', 'НЕТ ВОЗВРАТА'])
      : random(['IT HAS ARRIVED', 'THE END HAS COME', 'TIME IS UP', 'IT HAPPENED', 'NO RETURN']);
  }
  
  if (secondsLeft <= 86400) { // 24 часа
    return language === 'RU' ? random(PHRASES_RU_24H) : random(PHRASES_24H);
  }
  
  if (secondsLeft <= 7 * 86400) { // 7 дней
    return language === 'RU' ? random(PHRASES_RU_7D) : random(PHRASES_7D);
  }
  
  // Общие страшные фразы для большего времени
  const generalPhrasesRU = [
    'ВРЕМЯ ИДЁТ', 'ОТСЧЕТ ПРОДОЛЖАЕТСЯ', 'ОН ЖДЁТ', 'ТИКАЕТ', 'НИКТО НЕ УЙДЁТ',
    'СУДЬБА ПРЕДРЕШЕНА', 'ЧАСЫ НЕ ЛГУТ', 'ОНО НЕ СПИТ', 'ПРИБЛИЖАЕТСЯ', 'НЕИЗБЕЖНО'
  ];
  
  const generalPhrasesEN = [
    'TIME PASSES', 'COUNTDOWN CONTINUES', 'IT WAITS', 'TICKING', 'NO ONE ESCAPES',
    'FATE IS SEALED', 'THE CLOCK DOESN\'T LIE', 'IT DOESN\'T SLEEP', 'APPROACHING', 'INEVITABLE'
  ];
  
  return language === 'RU' ? random(generalPhrasesRU) : random(generalPhrasesEN);
}

// ===================== ОСНОВНАЯ ФУНКЦИЯ ЕЖЕДНЕВНЫХ СООБЩЕНИЙ =====================
async function sendDailyGroupMessages() {
  const now = new Date();

  try {
    // Получаем все группы из базы
    const groups = await pool.query(`SELECT chat_id, title FROM group_chats`);

    if (groups.rows.length === 0) {
      console.log('👥 No groups to send daily messages');
      return;
    }

    console.log(`📢 Sending daily messages to ${groups.rows.length} groups...`);

    for (const group of groups.rows) {
      try {
        // Проверяем админские права бота в группе
        let botIsAdmin = true;
        try {
          const admins = await bot.getChatAdministrators(group.chat_id);
          const botInfo = await bot.getMe();
          botIsAdmin = admins.some(
            admin => admin.user.is_bot && admin.user.username === botInfo.username
          );
        } catch (adminError) {
          console.error(`Can't get admins for group ${group.chat_id}:`, adminError.message);
          botIsAdmin = false;
        }

        if (!botIsAdmin) {
          console.log(`❌ Bot is not admin in group ${group.chat_id}, skipping`);
          // Удаляем группу из базы если бота выгнали
          await pool.query('DELETE FROM group_chats WHERE chat_id = $1', [group.chat_id]);
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

        // Создаём страшное сообщение для группы
        let groupMessage = '🩸 *THE ORDER IS ALREADY SET*' + `\n\n`;

        for (const u of users.rows) {
          const diff = new Date(u.death_timestamp) - now;
          const sec = Math.floor(diff / 1000);
          const name = displayName(u);
          const escapedName = escapeMarkdown(name);
          const horrorPhrase = getHorrorPhrase(u.language || 'EN', sec);

          if (u.ended || sec <= 0) {
            groupMessage += `💀 *${escapedName}* \\- ${horrorPhrase}` + `\n`;
          } else {
            const timeLeft = formatTime(sec);
            groupMessage += `🕰 *${escapedName}* \\- ${timeLeft} \\- ${horrorPhrase}` + `\n`;
          }
        }

        // Добавляем инструкцию внизу
        groupMessage += `\n` +
          `*Send /coun\\_help to join this list*` + `\n` +
          `_The countdown never stops_\\.`;

        try {
          await bot.sendMessage(group.chat_id, groupMessage, {
            parse_mode: 'MarkdownV2'
          });
          
          console.log(`✅ Daily message sent to group ${group.chat_id}`);
          
          // Задержка между сообщениями в группах
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (sendError) {
          console.error(`Failed to send daily message to group ${group.chat_id}:`, sendError.message);
          
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

    console.log('✅ Daily group messages completed');

  } catch (error) {
    console.error('Daily group messages database error:', error);
  }
}

// ===================== ФУНКЦИИ ДЛЯ АДМИНА =====================

// Принудительная отправка сообщений во все группы
export async function forceSendDailyMessages() {
  try {
    console.log('🚀 Force sending daily messages to all groups');
    await sendDailyGroupMessages();
    return { success: true };
  } catch (error) {
    console.error('Force send error:', error);
    return { success: false, error: error.message };
  }
}

// Тестовая отправка в конкретную группу
export async function testGroupMessage(chatId) {
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
      LIMIT 5
    `, [chatId]);

    let testMessage = '🧪 *TEST MESSAGE*' + `\n\n`;

    if (!users.rows.length) {
      testMessage += 'No users found in this group\\.';
    } else {
      for (const u of users.rows.slice(0, 3)) {
        const diff = new Date(u.death_timestamp) - now;
        const sec = Math.floor(diff / 1000);
        const name = displayName(u);
        const escapedName = escapeMarkdown(name);

        testMessage += `👤 *${escapedName}* \\- ${formatTime(sec)} left` + `\n`;
      }
    }

    testMessage += `\n*This is a test message*\\.`;

    await bot.sendMessage(chatId, testMessage, {
      parse_mode: 'MarkdownV2'
    });

    console.log(`✅ Test message sent to group ${chatId}`);
    return true;

  } catch (error) {
    console.error('Test group message error:', error);
    return false;
  }
}

// Получить статистику по группам
export async function getGroupStats() {
  try {
    const groups = await pool.query(`
      SELECT 
        gc.chat_id,
        gc.title,
        COUNT(gm.telegram_id) as member_count
      FROM group_chats gc
      LEFT JOIN group_members gm ON gc.chat_id = gm.chat_id
      GROUP BY gc.chat_id, gc.title
    `);

    return {
      totalGroups: groups.rows.length,
      groups: groups.rows,
      totalMembers: groups.rows.reduce((sum, group) => sum + parseInt(group.member_count), 0)
    };
  } catch (error) {
    console.error('Get group stats error:', error);
    return { totalGroups: 0, groups: [], totalMembers: 0 };
  }
}

// ===================== ЗАПУСК ЕЖЕДНЕВНЫХ СООБЩЕНИЙ =====================

// Проверка каждые 24 часа
const DAILY_INTERVAL = 24 * 60 * 60 * 1000;

console.log('👥 GROUP WATCHER STARTED - Daily messages every 24 hours');

// Первое сообщение через 30 секунд после запуска
setTimeout(() => {
  sendDailyGroupMessages();
  console.log('🔍 Initial daily messages sent');
}, 30000);

// Периодическая отправка
const dailyInterval = setInterval(sendDailyGroupMessages, DAILY_INTERVAL);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Stopping group watcher...');
  clearInterval(dailyInterval);
  process.exit(0);
});

export { sendDailyGroupMessages };
