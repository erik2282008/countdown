import { pool } from './db.js';
import { bot } from './bot.js';
import { POST_END } from './post_end_phrases.js';
import { EULA_QUOTES_EN, EULA_QUOTES_RU } from './eula_fragments.js';
import { maybeCut } from './utils.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Экранирование для MarkdownV2
function escapeMarkdown(text) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// Выбор цитаты по языку
function pickQuote(language) {
  return language === 'RU'
    ? random(EULA_QUOTES_RU)
    : random(EULA_QUOTES_EN);
}

// Основная функция проверки завершенных таймеров
async function checkEndedUsers() {
  const now = new Date();

  try {
    const { rows } = await pool.query(`
      SELECT 
        telegram_id, 
        language, 
        last_post_message, 
        extensions,
        ended
      FROM users
      WHERE ended = TRUE
    `);

    console.log(`👻 Checking ${rows.length} ended users...`);

    for (const user of rows) {
      try {
        // Базовый интервал 12 часов уменьшается на 2 часа за каждую отсрочку
        const baseInterval = 12 * 60 * 60 * 1000; // 12 часов
        const acceleration = (user.extensions || 0) * 2 * 60 * 60 * 1000; // -2 часа за отсрочку
        const interval = Math.max(60 * 60 * 1000, baseInterval - acceleration); // минимум 1 час

        // Проверяем можно ли отправлять сообщение
        const canSendMessage = !user.last_post_message || 
          (now - new Date(user.last_post_message)) > interval;

        if (canSendMessage) {
          // Решаем какую фразу отправить (EULA или пост-энд)
          const useEula = Math.random() < 0.5; // 50% шанс на EULA
          let message;

          if (useEula) {
            message = maybeCut(pickQuote(user.language || 'EN'));
          } else {
            message = random(POST_END);
          }

          // Экранируем сообщение для Markdown
          const escapedMessage = escapeMarkdown(message);

          try {
            await bot.sendMessage(
              user.telegram_id, 
              `👻 *IT SPEAKS*` + `\n\n` + `${escapedMessage}`,
              { parse_mode: 'MarkdownV2' }
            );
            
            console.log(`💬 Message sent to ended user: ${user.telegram_id}`);
            
            // Обновляем время последнего сообщения
            await pool.query(
              'UPDATE users SET last_post_message = NOW() WHERE telegram_id = $1',
              [user.telegram_id]
            );

            // Задержка между сообщениями чтобы не спамить
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (sendError) {
            if (sendError.response?.error_code === 403) {
              // Пользователь заблокировал бота - отмечаем это
              console.log(`🚫 User ${user.telegram_id} blocked the bot`);
              await pool.query(
                'UPDATE users SET last_post_message = NOW() WHERE telegram_id = $1',
                [user.telegram_id]
              );
            } else {
              console.error(`Failed to send message to ${user.telegram_id}:`, sendError.message);
            }
          }
        }

      } catch (userError) {
        console.error(`Error processing ended user ${user.telegram_id}:`, userError);
      }
    }

  } catch (error) {
    console.error('Post-end watcher database error:', error);
  }
}

// Функция для отправки тестового сообщения завершенному пользователю
export async function sendTestPostEndMessage(telegramId) {
  try {
    const { rows } = await pool.query(`
      SELECT language, extensions FROM users WHERE telegram_id = $1
    `, [telegramId]);

    if (!rows.length) {
      console.log(`User ${telegramId} not found`);
      return false;
    }

    const user = rows[0];
    const useEula = Math.random() < 0.5;
    let message;

    if (useEula) {
      message = maybeCut(pickQuote(user.language || 'EN'));
    } else {
      message = random(POST_END);
    }

    const escapedMessage = escapeMarkdown(message);

    await bot.sendMessage(
      telegramId,
      `👻 *TEST MESSAGE*` + `\n\n` + `${escapedMessage}`,
      { parse_mode: 'MarkdownV2' }
    );

    console.log(`✅ Test message sent to ${telegramId}`);
    return true;

  } catch (error) {
    console.error('Test message error:', error);
    return false;
  }
}

// Функция для принудительной отправки сообщения всем завершенным пользователям
export async function forceSendToAllEndedUsers() {
  try {
    const { rows } = await pool.query(`
      SELECT telegram_id, language FROM users WHERE ended = TRUE
    `);

    console.log(`📢 Force sending to ${rows.length} ended users...`);

    let success = 0;
    let failed = 0;

    for (const user of rows) {
      try {
        const message = random(POST_END);
        const escapedMessage = escapeMarkdown(message);

        await bot.sendMessage(
          user.telegram_id,
          `👻 *IT SPEAKS*` + `\n\n` + `${escapedMessage}`,
          { parse_mode: 'MarkdownV2' }
        );

        success++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Задержка

      } catch (error) {
        failed++;
        console.error(`Failed to send to ${user.telegram_id}:`, error.message);
      }
    }

    console.log(`✅ Force send completed: ${success} success, ${failed} failed`);
    return { success, failed };

  } catch (error) {
    console.error('Force send error:', error);
    return { success: 0, failed: 0 };
  }
}

// Проверка каждую минуту
const CHECK_INTERVAL = 60000; // 1 минута

console.log('👻 POST-END WATCHER STARTED - Checking every minute');

// Первая проверка через 10 секунд после запуска
setTimeout(() => {
  checkEndedUsers();
  console.log('🔍 Initial post-end check completed');
}, 10000);

// Периодическая проверка
setInterval(checkEndedUsers, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Stopping post-end watcher...');
  process.exit(0);
});

export { checkEndedUsers };
