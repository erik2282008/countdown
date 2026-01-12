import { pool } from './db.js';
import { bot } from './bot.js';
import { POST_END } from './post_end_phrases.js';
import { PHRASES_7D, PHRASES_24H, PHRASES_RU_7D, PHRASES_RU_24H } from './phrases.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  
  if (d > 0) {
    return `${d}d ${h}h`;
  } else if (h > 0) {
    return `${h}h ${m}m`;
  } else {
    return `${m}m ${s}s`;
  }
}

function getHorrorMessage(user, diffSec, language) {
  const sec = diffSec;
  
  if (sec <= 0) {
    const postEnd = language === 'RU' 
      ? ['ОНО РЯДОМ', 'НЕ ОБОРАЧИВАЙСЯ', 'УЖЕ ПОЗДНО', 'ОНО ВИДИТ ТЕБЯ', 'ВРЕМЯ ВЫШЛО', 'ОН ИДЁТ ЗА ТОБОЙ']
      : POST_END;
    return random(postEnd);
  }
  else if (sec <= 86400) { // 24 часа
    const phrases = language === 'RU' ? PHRASES_RU_24H : PHRASES_24H;
    return random(phrases);
  }
  else if (sec <= 7 * 86400) { // 7 дней
    const phrases = language === 'RU' ? PHRASES_RU_7D : PHRASES_7D;
    return random(phrases);
  }
  else if (sec <= 30 * 86400) { // 30 дней
    return language === 'RU' 
      ? 'МЕСЯЦ - ЭТО НЕМНОГО' 
      : 'ONE MONTH IS NOT MUCH';
  }
  else if (sec <= 90 * 86400) { // 90 дней
    return language === 'RU'
      ? 'ВРЕМЯ ТЕЧЁТ БЫСТРЕЕ'
      : 'TIME FLOWS FASTER';
  }
  else {
    return language === 'RU'
      ? 'ОТСЧЁТ ИДЁТ'
      : 'COUNTDOWN CONTINUES';
  }
}

function displayName(user) {
  if (user.username) return `@${user.username}`;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return `ID:${user.telegram_id}`;
}

// ===================== РАЗ В СУТКИ =====================
setInterval(async () => {
  const now = new Date();

  try {
    // Получаем все активные группы
    const { rows: groups } = await pool.query(`
      SELECT chat_id, title FROM group_chats 
      WHERE daily_active = TRUE
    `);

    console.log(`🕰 Daily check for ${groups.length} groups at ${now.toISOString()}`);

    // Получаем username бота один раз
    const botInfo = await bot.getMe();
    const botUsername = botInfo.username;

    for (const group of groups) {
      try {
        // Проверяем, что бот всё ещё админ
        const admins = await bot.getChatAdministrators(group.chat_id);
        const botIsAdmin = admins.some(
          a => a.user.is_bot && a.user.username === botUsername
        );

        if (!botIsAdmin) {
          console.log(`Bot is not admin in group ${group.chat_id}, disabling`);
          await pool.query(
            'UPDATE group_chats SET daily_active = FALSE WHERE chat_id = $1',
            [group.chat_id]
          );
          continue;
        }

        // Получаем участников этой группы
        const { rows: users } = await pool.query(`
          SELECT
            u.telegram_id,
            u.username,
            u.first_name,
            u.last_name,
            u.death_timestamp,
            u.ended,
            u.language
          FROM users u
          JOIN group_members gm ON gm.telegram_id = u.telegram_id
          WHERE gm.chat_id = $1
          ORDER BY u.death_timestamp ASC
          LIMIT 50
        `, [group.chat_id]);

        if (!users.length) {
          // Если в группе нет участников с таймером
          const messages = [
            "🩸 *THE LIST IS EMPTY*\n\nNo one here has revealed their fate yet.\nSend /count_help to learn how to appear.",
            "💀 *SILENCE*\n\nNo countdowns found in this place.\nUse /count_help to join the order.",
            "🕰 *NOTHING YET*\n\nThe order has not been established here.\nType /count_help to begin."
          ];
          
          await bot.sendMessage(
            group.chat_id,
            random(messages),
            { 
              parse_mode: 'Markdown',
              disable_web_page_preview: true 
            }
          );
          continue;
        }

        // Формируем сообщение для группы
        let message = '';
        const hasCritical = users.some(u => {
          const diff = new Date(u.death_timestamp) - now;
          return diff <= 7 * 86400000 && diff > 0;
        });

        if (hasCritical) {
          message += `⏳ *TIME IS RUNNING OUT*\n\n`;
        } else {
          message += `🩸 *THE ORDER IS ALREADY SET*\n\n`;
        }

        let count = 0;
        for (const user of users) {
          if (count >= 15) { // Ограничиваем список
            message += `\n... и ещё ${users.length - 15} участников\n`;
            break;
          }

          const name = displayName(user);
          const diff = new Date(u.death_timestamp) - now;
          const diffSec = Math.floor(diff / 1000);

          if (user.ended || diff <= 0) {
            message += `💀 *${name}* — *IT HAS ALREADY HAPPENED*\n`;
          } else {
            const timeStr = formatTime(diffSec);
            
            // Добавляем хоррор-сообщение для тех, у кого мало времени
            if (diffSec <= 7 * 86400 && diffSec > 0) {
              const horrorMsg = getHorrorMessage(user, diffSec, user.language || 'EN');
              message += `🕰 *${name}* — ${timeStr} | ${horrorMsg}\n`;
            } else {
              message += `📅 *${name}* — ${timeStr} осталось\n`;
            }
          }
          count++;
        }

        message += `\n📌 Отправьте /count_help чтобы появиться в этом списке`;

        // Отправляем сообщение
        await bot.sendMessage(
          group.chat_id,
          message,
          { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
          }
        );

        // Анти-спам задержка
        await new Promise(r => setTimeout(r, 1000));

      } catch (groupError) {
        console.error(`Error processing group ${group.chat_id}:`, groupError);
        
        // Если бота удалили из группы, помечаем как неактивную
        if (groupError.response && groupError.response.statusCode === 403) {
          await pool.query(
            'UPDATE group_chats SET daily_active = FALSE WHERE chat_id = $1',
            [group.chat_id]
          );
        }
      }
    }

  } catch (mainError) {
    console.error('Daily group watcher error:', mainError);
  }
}, 24 * 60 * 60 * 1000); // Раз в сутки

console.log('👁 GROUP WATCHER STARTED - Daily messages enabled');
