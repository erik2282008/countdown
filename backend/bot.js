import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';

const token = process.env.BOT_TOKEN;
console.log('🤖 Bot token:', token ? 'SET' : 'MISSING');

if (!token) {
  console.error('❌ BOT_TOKEN not set! Bot will not work.');
  process.exit(1);
}

// Создаем бота с правильной конфигурацией
const bot = new TelegramBot(token, { 
  polling: true,
  retryTimeout: 5000,
  pollingTimeout: 30000
});

console.log('✅ Bot starting with token...');

// Обработка ошибок бота
bot.on('polling_error', (error) => {
  if (error.code === 'EFATAL' && error.message.includes('Bot Token not provided')) {
    console.error('❌ Invalid bot token!');
  } else if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
    console.error('❌ 409 Conflict - Another bot instance is running!');
    console.error('💡 Stop all other instances and restart');
  } else {
    console.error('📶 Polling error:', error.message);
  }
});

bot.on('error', (error) => {
  console.error('💣 Bot error:', error);
});

// ===================== КОМАНДЫ =====================
bot.onText(/\/start/, async (msg) => {
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name || 'User';
  
  console.log('📥 New user:', telegramId, firstName);

  try {
    // Сохраняем пользователя в базу
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, NOW() + INTERVAL '1 year')
       ON CONFLICT (telegram_id) DO NOTHING`,
      [telegramId, 'EN']
    );

    // Отправляем приветственное сообщение
    await bot.sendMessage(
      telegramId,
      '💀 *COUNTDOWN*\n\n┏━━━━━━━━━━━━━━━━━━┓\n' +
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
      '_There is no going back._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: '🩸 REVEAL YOUR FATE 🩸',
            web_app: { 
              url: process.env.APP_URL || 'https://peculiar-ericha-erikos-a5e4ca37.koyeb.app/'
            }
          }]]
        }
      }
    );
    
    console.log('📤 Welcome message sent to:', telegramId);
  } catch (err) {
    console.error('❌ BOT ERROR for user', telegramId, ':', err);
  }
});

// ===================== АДМИН КОМАНДЫ =====================
function isAdmin(msg) {
  return msg.from.id === 647773442;
}

bot.onText(/\/admin/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  await bot.sendMessage(
    msg.chat.id,
    `🕳 *ADMIN PANEL*\n\nUser ID: ${msg.from.id}\nStatus: ADMIN\n\nAvailable commands:\n• /stats - Show statistics\n• /broadcast - Send message to all users`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;

  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE death_timestamp > NOW()');
    const endedUsers = await pool.query('SELECT COUNT(*) FROM users WHERE ended = TRUE');
    
    await bot.sendMessage(
      msg.chat.id,
      `📊 *STATISTICS*\n\n` +
      `👥 Total users: ${totalUsers.rows[0].count}\n` +
      `⏳ Active countdowns: ${activeUsers.rows[0].count}\n` +
      `💀 Finished countdowns: ${endedUsers.rows[0].count}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Error getting statistics');
  }
});

console.log('🚀 COUNTDOWN BOT STARTED SUCCESSFULLY');
console.log('🆔 Admin ID: 647773442');

export { bot };
