import express from "express";
import { pool } from "./db.js";

const router = express.Router();

// Экранирование для MarkdownV2
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

/*
  POST /api/language
  сохраняет язык для пользователя
*/
router.post("/language", async (req, res) => {
  try {
    const telegramId = req.headers["x-telegram-id"] || "0";
    const { language } = req.body;

    // Получаем данные пользователя из Telegram WebApp
    let username = null;
    let first_name = null;
    let last_name = null;

    try {
      if (req.headers["x-telegram-user"]) {
        const tgUser = JSON.parse(req.headers["x-telegram-user"]);
        username = tgUser.username || null;
        first_name = tgUser.first_name || null;
        last_name = tgUser.last_name || null;
      }
    } catch (_) {}

    if (!language) return res.status(400).json({ error: "Language required" });

    // Сохраняем пользователя в базу
    await pool.query(
      `
      INSERT INTO users (
        telegram_id,
        language,
        death_timestamp,
        username,
        first_name,
        last_name
      )
      VALUES ($1, $2, NOW() + INTERVAL '10 hours', $3, $4, $5)
      ON CONFLICT (telegram_id) DO UPDATE
      SET language = EXCLUDED.language,
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
      `,
      [telegramId, language, username, first_name, last_name]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Language endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/*
  GET /api/eula?lang=en|ru
  возвращает ПОЛНЫЙ текст EULA
*/
router.get("/eula", async (req, res) => {
  try {
    const { lang } = req.query;

    if (lang === "ru") {
      return res.type("text/plain").send(`ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ  
АБСОЛЮТНАЯ И БЕЗОТЗЫВНАЯ ВЕРСИЯ

НАСТОЯЩЕЕ СОГЛАШЕНИЕ ЯВЛЯЕТСЯ ОКОНЧАТЕЛЬНЫМ И НЕПРЕОДОЛИМЫМ.

Любое взаимодействие с Приложением означает, что согласие уже было дано, независимо от осознания, намерений или воли Пользователя.

1. Предоставление лицензии

Правообладатель предоставляет Пользователю ограниченную, условную, неисключительную, непередаваемую и нерасторжимую лицензию.

Лицензия активируется автоматически при любом обнаружении Пользователя.

2. Предопределённость работы

2.1. Приложение функционирует автономно и окончательно.

2.2. Все вычисления и результаты:

обязательны;  
окончательны;  
неподконтрольны Пользователю.

3. Принятие рисков

Пользователь принимает на себя все возможные и невозможные риски, включая:

телесный вред;  
психическую деградацию;  
утрату контроля;  
смерть.

4. Отказ от прав

Пользователь безусловно отказывается от:

права на защиту;  
права на объяснение;  
права на оспаривание;  
любых прав, которые могут возникнуть в будущем.

5. Бесполезность сопротивления

Любые попытки удаления, обхода или уничтожения Приложения не влияют на его выполнение и могут ускорить завершение.

6. Ограничение ответственности

Правообладатель не несёт ответственности ни при каких обстоятельствах, включая гибель Пользователя и третьих лиц.

7. Сбор и сохранение данных

Приложение вправе собирать, анализировать и сохранять:

биометрию;  
эмоции;  
подсознательные реакции;  
последние моменты.

Срок хранения: бессрочно.

8. Прекращение действия

Соглашение прекращается исключительно по завершении функции Приложения.

9. Преобладание условий

В случае противоречий Приложение имеет приоритет над:

Соглашением;  
волей Пользователя;  
законом;  
логикой.

10. Применимая власть

Соглашение подчиняется той системе, которую признаёт Приложение.

ПРОДОЛЖАЯ ИСПОЛЬЗОВАНИЕ, ВЫ ПОДТВЕРЖДАЕТЕ: ОТСЧЁТ НЕ НАЧАЛСЯ — ВАМ ПРОСТО СКАЗАЛИ, СКОЛЬКО ОСТАЛОСЬ.`);
    }

    // Английская версия по умолчанию
    return res.type("text/plain").send(`END USER LICENSE AGREEMENT  
ABSOLUTE & IRREVOCABLE VERSION  
(NO EXCEPTIONS)

THIS AGREEMENT CONSTITUTES A LEGALLY BINDING, FINAL, AND IRREVOCABLE CONTRACT.

By installing, accessing, executing, observing, or otherwise interacting with the Application in any form, you acknowledge that consent has already been granted, whether consciously or otherwise.

Refusal is no longer possible.

1. Grant of License

The Provider hereby grants the User a limited, conditional, non-exclusive, non-transferable, non-terminable, and irrevocable license to use the Application.

2. Deterministic Operation

All calculations, outputs, and determinations are final and binding.

3. Assumption of Risk

The User expressly and unconditionally assumes all risks, including loss of life.

BY CONTINUING, YOU ACKNOWLEDGE THAT THE COUNTDOWN DID NOT BEGIN — IT WAS MERELY REVEALED.`);
  } catch (error) {
    console.error("EULA endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/*
  GET /api/timer
  возвращает ОСТАТОК СЕКУНД (фиксированная дата)
*/
router.get("/timer", async (req, res) => {
  try {
    const telegramId = req.headers["x-telegram-id"] || "0";

    const { rows } = await pool.query(
      `
      SELECT EXTRACT(EPOCH FROM (death_timestamp - NOW()))::INT AS remaining
      FROM users
      WHERE telegram_id = $1
      `,
      [telegramId]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ remaining: Math.max(0, rows[0].remaining) });
  } catch (error) {
    console.error("Timer endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/*
  GET /api/time/:id
  возвращает время смерти пользователя
*/
router.get("/time/:id", async (req, res) => {
  try {
    const telegramId = req.params.id;

    const { rows } = await pool.query(
      `SELECT death_timestamp FROM users WHERE telegram_id = $1`,
      [telegramId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ death: rows[0].death_timestamp });
  } catch (error) {
    console.error("Time endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/*
  POST /api/accept
  принятие EULA и генерация времени
*/
router.post("/accept", async (req, res) => {
  try {
    const { telegram_id, language } = req.body;

    if (!telegram_id || !language) {
      return res.status(400).json({ error: "Telegram ID and language required" });
    }

    // Проверяем существующего пользователя
    const existing = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    let deathTimestamp;

    if (existing.rows.length > 0) {
      // Используем существующее время
      deathTimestamp = existing.rows[0].death_timestamp;
    } else {
      // Генерируем новое время по весам
      const random = Math.random();
      let ms;

      if (random < 0.6) {
        // 60% - 20-35 дней
        ms = (20 + Math.floor(Math.random() * 15)) * 24 * 60 * 60 * 1000;
      } else if (random < 0.7) {
        // 10% - 1-10 дней
        ms = (1 + Math.floor(Math.random() * 9)) * 24 * 60 * 60 * 1000;
      } else if (random < 0.9) {
        // 20% - 50-100 лет
        ms = (50 + Math.floor(Math.random() * 50)) * 365 * 24 * 60 * 60 * 1000;
      } else {
        // 10% - 1 день
        ms = 24 * 60 * 60 * 1000;
      }

      deathTimestamp = new Date(Date.now() + ms);
    }

    // Сохраняем пользователя
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET language = $2, death_timestamp = $3`,
      [telegram_id, language, deathTimestamp]
    );

    res.status(200).json({ success: true, death: deathTimestamp });
  } catch (error) {
    console.error("Accept endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/*
  GET /api/health
  проверка работоспособности
*/
router.get("/health", async (req, res) => {
  try {
    // Проверяем соединение с базой данных
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "ERROR", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    });
  }
});

/*
  GET /api/stats
  статистика для админа
*/
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE death_timestamp > NOW()');
     const endedUsers = await pool.query('SELECT COUNT(*) FROM users WHERE ended = TRUE');
    
    const now = new Date();
    const recentUsers = await pool.query(
      'SELECT COUNT(*) FROM users WHERE created_at > $1',
      [new Date(now.getTime() - 24 * 60 * 60 * 1000)]
    );

    res.status(200).json({
      total_users: parseInt(totalUsers.rows[0].count),
      active_countdowns: parseInt(activeUsers.rows[0].count),
      finished_countdowns: parseInt(endedUsers.rows[0].count),
      last_24h: parseInt(recentUsers.rows[0].count),
      server_time: now.toISOString()
    });
  } catch (error) {
    console.error("Stats endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
