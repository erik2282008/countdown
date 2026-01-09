import YooKassa from 'yookassa';
import { pool } from './db.js';
import { bot } from './bot.js';

// ================== YOOKASSA INIT ==================
const yooKassa = new YooKassa({
  shopId: '1241024',
  secretKey: 'test_dovNMVr5Rjt6Ez5W5atO2a1RDpzNKLlQh6dcp-fDpsI'
});

// ================== ВСПОМОГАТЕЛЬНОЕ ==================
function generateNewDeathTimestamp() {
  const min = 10 * 60 * 60 * 1000; // 10 часов
  const max = 100 * 365 * 24 * 60 * 60 * 1000; // 100 лет
  const now = Date.now();
  return new Date(now + min + Math.random() * (max - min));
}

// ================== СМЕНА ДАТЫ ==================
export async function createPayment(telegram_id) {
  const payment = await yooKassa.createPayment({
    amount: {
      value: '199.00',
      currency: 'RUB'
    },
    confirmation: {
      type: 'redirect',
      return_url: process.env.APP_URL
    },
    description: 'DATE CORRECTION',
    metadata: {
      telegram_id,
      type: 'change'
    }
  });

  await bot.sendMessage(
    telegram_id,
    `PAYMENT INITIATED\n${payment.confirmation.confirmation_url}`
  );
}

export async function handleSuccess(telegram_id) {
  const newDeath = generateNewDeathTimestamp();

  await pool.query(
    `UPDATE users
     SET 
       death_timestamp = $1,
       warned_7d = FALSE,
       warned_24h = FALSE,
       ended = FALSE
     WHERE telegram_id = $2`,
    [newDeath, telegram_id]
  );

  await bot.sendMessage(telegram_id, 'TIME HAS BEEN ALTERED');
}

// ================== ОТСРОЧКА КОНЦА ==================
export async function createDelayPayment(telegram_id) {
  const payment = await yooKassa.createPayment({
    amount: {
      value: '299.00',
      currency: 'RUB'
    },
    confirmation: {
      type: 'redirect',
      return_url: process.env.APP_URL
    },
    description: 'DELAY THE END',
    metadata: {
      telegram_id,
      type: 'delay'
    }
  });

  await bot.sendMessage(
    telegram_id,
    `EXTENSION REQUESTED\n${payment.confirmation.confirmation_url}`
  );
}

export async function handleDelay(telegram_id) {
  await pool.query(
    `UPDATE users
     SET 
       death_timestamp = death_timestamp + INTERVAL '72 hours',
       warned_7d = FALSE,
       warned_24h = FALSE,
       ended = FALSE,
       extensions = extensions + 1
     WHERE telegram_id = $1`,
    [telegram_id]
  );

  await bot.sendMessage(telegram_id, 'TIME HAS BEEN EXTENDED');
}
