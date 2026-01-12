import express from "express";
import { pool } from "./db.js";

const router = express.Router();

/*
  POST /api/language
  сохраняет язык для пользователя (один раз)
*/
router.post("/language", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] || "0";
  const { language } = req.body;

  // 🔽 ДОБАВЛЕНО: получение данных пользователя из Telegram WebApp
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

  if (!language) return res.sendStatus(400);

  // 🔽 ИСХОДНАЯ ЛОГИКА СОХРАНЕНА + ДОБАВЛЕНЫ ПОЛЯ ИМЕНИ
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

  res.sendStatus(200);
});

/*
  GET /api/eula?lang=en|ru
  возвращает ПОЛНЫЙ текст EULA
*/
router.get("/eula", async (req, res) => {
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
});

/*
  GET /api/timer
  возвращает ОСТАТОК СЕКУНД (фиксированная дата)
*/
router.get("/timer", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] || "0";

  const { rows } = await pool.query(
    `
    SELECT EXTRACT(EPOCH FROM (death_timestamp - NOW()))::INT AS remaining
    FROM users
    WHERE telegram_id = $1
    `,
    [telegramId]
  );

  if (!rows.length) return res.sendStatus(404);

  res.json({ remaining: Math.max(0, rows[0].remaining) });
});

export default router;
