import TelegramBot from 'node-telegram-bot-api';
import { pool } from './db.js';
import { createPayment, createDelayPayment } from './payments.js';

const BOT_TOKEN = '8447119124:AAHFwKTxugSjG7_3of3JW4PCjhexo19Quxc';

export const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ---------- /start ----------
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const text =
`OPEN APPLICATION
YOUR TIME IS ALREADY CALCULATED`;

  await bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'OPEN',
          web_app: { url: process.env.APP_URL }
        }
      ]]
    }
  });
});

// ---------- РУЧНАЯ РАССЫЛКА ----------
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const text = match[1];

  const { rows } = await pool.query(
    'SELECT telegram_id FROM users'
  );

  for (const u of rows) {
    try {
      await bot.sendMessage(u.telegram_id, text);
    } catch (_) {}
  }
});

// ---------- ПЛАТНАЯ СМЕНА ДАТЫ ----------
bot.onText(/\/change/, async (msg) => {
  const id = msg.chat.id;
  await createPayment(id);
});

// ---------- ПЛАТНАЯ ОТСРОЧКА ----------
bot.onText(/\/delay/, async (msg) => {
  const id = msg.chat.id;
  await createDelayPayment(id);
});

// ---------- ПОВЕДЕНИЕ ПОСЛЕ НУЛЯ ----------
bot.on('message', async (msg) => {
  const id = msg.chat.id;

  const r = await pool.query(
    'SELECT ended FROM users WHERE telegram_id = $1',
    [id]
  );

  if (r.rows[0]?.ended) {
    setTimeout(() => {
      bot.sendMessage(id, '...');
    }, 3000);
  }
});
