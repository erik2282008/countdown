import { pool } from './db.js';
import { sendWarningMessage } from './bot.js';
import { PHRASES_7D, PHRASES_24H, PHRASES_RU_7D, PHRASES_RU_24H } from './phrases.js';

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Функция для получения фразы на нужном языке
function getPhrase(language, timeLeft) {
  const isCritical = timeLeft <= 86400; // 24 часа
  const isWarning = timeLeft <= 7 * 86400; // 7 дней
  
  if (language === 'RU') {
    if (isCritical) return random(PHRASES_RU_24H);
    if (isWarning) return random(PHRASES_RU_7D);
  } else {
    if (isCritical) return random(PHRASES_24H);
    if (isWarning) return random(PHRASES_7D);
  }
  
  return null; // Нет фразы для этого периода
}

// Основная функция проверки
async function checkUsers() {
  const now = new Date();

  try {
    const { rows } = await pool.query(`
      SELECT 
        telegram_id, 
        death_timestamp, 
        warned_7d, 
        warned_24h, 
        ended,
        language
      FROM users 
      WHERE ended = FALSE
    `);

    for (const user of rows) {
      try {
        const diff = new Date(user.death_timestamp) - now;
        const secondsLeft = Math.floor(diff / 1000);

        // Если время вышло - отмечаем завершение
        if (secondsLeft <= 0 && !user.ended) {
          await pool.query(
            'UPDATE users SET ended = TRUE WHERE telegram_id = $1',
            [user.telegram_id]
          );
          console.log(`✅ Countdown ended for user: ${user.telegram_id}`);
          continue;
        }

        // Пропускаем если время ещё не наступило для предупреждений
        if (secondsLeft <= 0) continue;

        // --- За 7 дней ---
        if (secondsLeft <= 7 * 86400 && secondsLeft > 86400 && !user.warned_7d) {
          const phrase = getPhrase(user.language || 'EN', secondsLeft);
          if (phrase) {
            try {
              await sendWarningMessage(user.telegram_id, phrase);
              await pool.query(
                'UPDATE users SET warned_7d = TRUE WHERE telegram_id = $1',
                [user.telegram_id]
              );
              console.log(`⚠️ 7-day warning sent to: ${user.telegram_id}`);
            } catch (error) {
              console.error(`Failed to send 7-day warning to ${user.telegram_id}:`, error);
            }
          }
        }

        // --- За 24 часа ---
        if (secondsLeft <= 86400 && secondsLeft > 0 && !user.warned_24h) {
          const phrase = getPhrase(user.language || 'EN', secondsLeft);
          if (phrase) {
            try {
              await sendWarningMessage(user.telegram_id, phrase);
              await pool.query(
                'UPDATE users SET warned_24h = TRUE WHERE telegram_id = $1',
                [user.telegram_id]
              );
              console.log(`🚨 24-hour warning sent to: ${user.telegram_id}`);
            } catch (error) {
              console.error(`Failed to send 24-hour warning to ${user.telegram_id}:`, error);
            }
          }
        }

        // Логирование для отладки (только каждые 100 пользователей)
        if (Math.random() < 0.01) {
          const days = Math.floor(secondsLeft / 86400);
          const hours = Math.floor((secondsLeft % 86400) / 3600);
          console.log(`👀 Watching: ${user.telegram_id} - ${days}d ${hours}h left`);
        }

      } catch (userError) {
        console.error(`Error processing user ${user.telegram_id}:`, userError);
      }
    }
  } catch (error) {
    console.error('Watcher database error:', error);
  }
}

// Функция для проверки одного пользователя (для тестов)
export async function checkSingleUser(telegramId) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        telegram_id, 
        death_timestamp, 
        warned_7d, 
        warned_24h, 
        ended,
        language
      FROM users 
      WHERE telegram_id = $1
    `, [telegramId]);

    if (rows.length === 0) {
      console.log(`User ${telegramId} not found`);
      return;
    }

    const user = rows[0];
    const now = new Date();
    const diff = new Date(user.death_timestamp) - now;
    const secondsLeft = Math.floor(diff / 1000);

    console.log(`👤 User: ${telegramId}`);
    console.log(`⏰ Time left: ${secondsLeft} seconds`);
    console.log(`📅 Date: ${user.death_timestamp}`);
    console.log(`🚩 Warned 7d: ${user.warned_7d}`);
    console.log(`🚩 Warned 24h: ${user.warned_24h}`);
    console.log(`🔚 Ended: ${user.ended}`);
    console.log(`🌐 Language: ${user.language}`);

    if (secondsLeft <= 0 && !user.ended) {
      console.log('🔄 Marking as ended...');
      await pool.query(
        'UPDATE users SET ended = TRUE WHERE telegram_id = $1',
        [telegramId]
      );
    }

  } catch (error) {
    console.error('Single user check error:', error);
  }
}

// Запускаем проверку каждые 30 секунд
const CHECK_INTERVAL = 30000; // 30 секунд

console.log('👀 WATCHER STARTED - Checking every 30 seconds');

// Первая проверка при запуске
setTimeout(() => {
  checkUsers();
  console.log('🔍 Initial check completed');
}, 5000);

// Периодическая проверка
setInterval(checkUsers, CHECK_INTERVAL);

// Обработка graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Stopping watcher...');
  // Здесь можно добавить очистку интервалов если нужно
  process.exit(0);
});

export { checkUsers };
