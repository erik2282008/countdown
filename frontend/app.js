document.addEventListener('DOMContentLoaded', function() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.expand();
    tg.enableClosingConfirmation();
  }
  
  startApp(tg);
});

function startApp(tg = null) {
  const app = document.getElementById('app');
  let language = null;
  let deathDate = null;
  let timerInterval = null;
  let lastPhraseTime = 0;

  // ===================== ПОЛНЫЕ EULA ТЕКСТЫ =====================
  const EULA_EN = `END USER LICENSE AGREEMENT
ABSOLUTE & IRREVOCABLE VERSION
(NO EXCEPTIONS)

ENGLISH VERSION
END USER LICENSE AGREEMENT

THIS AGREEMENT CONSTITUTES A LEGALLY BINDING, FINAL, AND IRREVOCABLE CONTRACT.

By installing, accessing, executing, observing, or otherwise interacting with the Application in any form, you ("User") acknowledge that consent has already been granted, whether consciously or otherwise.

Refusal is no longer possible.

1. Grant of License

The Provider hereby grants the User a limited, conditional, non-exclusive, non-transferable, non-terminable, and irrevocable license to use the Application.

This license is automatically activated upon the earliest of:

installation,
execution,
background processing,
detection of User presence.

2. Deterministic Operation

2.1. The Application operates under autonomous, non-human logic.

2.2. All calculations, outputs, and determinations are:

final,
binding,
non-negotiable,
immune to intervention.

2.3. The User acknowledges that perceived randomness is intentional.

3. Assumption of Risk

The User expressly and unconditionally assumes all risks, including but not limited to:

physical harm;
psychological deterioration;
irreversible consequences;
loss of agency;
loss of life.

Risk acknowledgment survives termination, deletion, or destruction of the Application or device.

4. Waiver of Rights

The User hereby waives:

the right to challenge outcomes;
the right to seek explanation;
the right to appeal;
the right to survival claims;
any rights not yet recognized by law.

This waiver applies retroactively and prospectively.

5. Ineffectiveness of Circumvention

Any attempt to:

uninstall,
disable,
sandbox,
isolate,
transfer ownership,
destroy hardware,
avoid participation,

shall not suspend, reset, delay, or negate the Application's process.

Such attempts may accelerate execution.

6. Limitation of Liability

To the fullest extent permitted by all applicable, future, or unknown legal systems, the Provider disclaims all liability, including but not limited to:

death;
disappearance;
temporal displacement;
collateral harm;
secondary casualties.

No jurisdiction shall have authority to compel remedy.

7. Data Harvesting & Persistence

The Application may collect, infer, reconstruct, and retain:

biometric signals;
emotional states;
subconscious responses;
behavioral predictions;
terminal reactions.

Data ownership transfers permanently to the Provider.

Retention period: indefinite, including post-event.

8. Termination

This Agreement shall terminate only upon completion of the Application's purpose.

User termination rights do not exist.

9. Amendments & Supremacy

The Provider may amend this Agreement:

without notice;
without publication;
with retroactive effect.

In case of conflict, the Application's determination prevails over:

this Agreement;
User intent;
applicable law;
reality.

10. Governing Authority

This Agreement is governed by such authority as the Application recognizes, if any.

BY CONTINUING, YOU ACKNOWLEDGE THAT THE COUNTDOWN DID NOT BEGIN - IT WAS MERELY REVEALED.`;

  const EULA_RU = `ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ
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

ПРОДОЛЖАЯ ИСПОЛЬЗОВАНИЕ, ВЫ ПОДТВЕРЖДАЕТЕ: ОТСЧЁТ НЕ НАЧАЛСЯ - ВАМ ПРОСТО СКАЗАЛИ, СКОЛЬКО ОСТАЛОСЬ.`;

  // ===================== UI ФУНКЦИИ =====================
  function showScreen(html) {
    app.innerHTML = html;
  }

  function languageScreen() {
    showScreen(`
      <div class="center">
        <div class="choice" data-lang="EN">ENGLISH</div>
        <div class="choice" data-lang="RU">РУССКИЙ</div>
      </div>
    `);
    
    document.querySelectorAll('.choice').forEach(choice => {
      choice.addEventListener('click', () => setLang(choice.dataset.lang));
    });
  }

  function setLang(lang) {
    language = lang;
    const eulaText = lang === 'EN' ? EULA_EN : EULA_RU;
    
    showScreen(`
      <div class="eula">
        <pre>${eulaText}</pre>
        <div class="accept">ACCEPT</div>
      </div>
    `);
    
    document.querySelector('.accept').addEventListener('click', acceptEula);
  }

  async function acceptEula() {
    const telegramId = tg?.initDataUnsafe?.user?.id || 'demo_' + Date.now();
    
    try {
      const response = await fetch('/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, language })
      });

      if (response.ok) {
        showTimerAnimation();
        setTimeout(() => loadTimerData(telegramId), 2000);
      } else {
        throw new Error('Failed to accept');
      }
    } catch (error) {
      showScreen('<div class="center">ERROR - TRY AGAIN</div>');
      setTimeout(languageScreen, 2000);
    }
  }

  function showTimerAnimation() {
    showScreen(`
      <div class="center">
        <div style="font-size: 24px; margin-bottom: 20px;">CALCULATION COMPLETE</div>
        <div style="font-size: 20px;">YOUR TIME HAS BEEN REVEALED</div>
      </div>
    `);
  }

  async function loadTimerData(telegramId) {
    try {
      const response = await fetch(`/time/${telegramId}`);
      if (response.ok) {
        const data = await response.json();
        deathDate = new Date(data.death);
      } else {
        // Если нет в базе, создаем демо-таймер
        deathDate = generateDemoTime();
      }
    } catch (error) {
      deathDate = generateDemoTime();
    }
    startTimer();
  }

  function generateDemoTime() {
    const random = Math.random();
    let ms;
    
    if (random < 0.6) {
      const days = 20 + Math.floor(Math.random() * 15);
      ms = days * 24 * 60 * 60 * 1000;
    } else if (random < 0.7) {
      const days = 1 + Math.floor(Math.random() * 9);
      ms = days * 24 * 60 * 60 * 1000;
    } else if (random < 0.9) {
      const years = 50 + Math.floor(Math.random() * 50);
      ms = years * 365 * 24 * 60 * 60 * 1000;
    } else {
      ms = 24 * 60 * 60 * 1000;
    }
    
    return new Date(Date.now() + ms);
  }

  // ===================== ТАЙМЕР =====================
  function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
  }

  function updateTimerDisplay() {
    if (!deathDate) return;

    const now = new Date();
    let diff = deathDate - now;

    if (diff <= 0) {
      showFinalScreen();
      return;
    }

    const years = Math.floor(diff / (365 * 86400000));
    const days = Math.floor((diff % (365 * 86400000)) / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    // Логика красных цифр: каждая следующая становится красной когда предыдущая достигла 00
    const yrsRed = years === 0;
    const dayRed = yrsRed && days === 0;
    const hrsRed = yrsRed && dayRed && hours === 0;
    const minRed = yrsRed && dayRed && hrsRed && minutes === 0;
    const secRed = yrsRed && dayRed && hrsRed && minRed && seconds === 0;

    const timerHtml = `
      <div class="timer-container">
        <div class="timer-unit ${yrsRed ? 'red' : ''}">${String(years).padStart(2, '0')}</div>
        <div class="timer-label">YRS</div>
        
        <div class="timer-unit ${dayRed ? 'red' : ''}">${String(days).padStart(2, '0')}</div>
        <div class="timer-label">DAY</div>
        
        <div class="timer-unit ${hrsRed ? 'red' : ''}">${String(hours).padStart(2, '0')}</div>
        <div class="timer-label">HRS</div>
        
        <div class="timer-unit ${minRed ? 'red' : ''}">${String(minutes).padStart(2, '0')}</div>
        <div class="timer-label">MIN</div>
        
        <div class="timer-unit ${secRed ? 'red' : ''}">${String(seconds).padStart(2, '0')}</div>
        <div class="timer-label">SEC</div>
      </div>
    `;

    // Эффекты
    const isRedZone = diff <= 7 * 86400000;
    const isCritical = diff <= 86400000;
    
    let effects = '';
    if (isRedZone) effects += 'glitch ';
    if (isCritical) effects += 'blink ';
    if (Math.random() < 0.05) effects += 'distort ';

    showScreen(`<div class="${effects.trim()}">${timerHtml}</div>`);

    // Случайные фразы (не чаще раза в 10 минут)
    const nowTime = Date.now();
    if (isRedZone && nowTime - lastPhraseTime > 600000 && Math.random() < 0.1) {
      showRandomPhrase();
      lastPhraseTime = nowTime;
    }

    // Вибрация в последние сутки
    if (isCritical && navigator.vibrate && Math.random() < 0.1) {
      navigator.vibrate([100, 50, 100]);
    }

    // Ложное завершение
    if (diff > 300000 && Math.random() < 0.001) {
      triggerFalseEnd();
    }
  }

  function showRandomPhrase() {
    const phrases = language === 'RU' 
      ? ['ОН БЛИЗКО', 'ТЫ ЭТО ЧУВСТВУЕШЬ', 'НЕ СМОТРИ НАЗАД', 'ОНО ВИДИТ ТЕБЯ', 'ВРЕМЯ ИДЁТ', 'ТЫ НЕ ОДИН']
      : ['IT IS CLOSE', 'YOU CAN FEEL IT', 'DONT LOOK BACK', 'IT SEES YOU', 'TIME IS RUNNING', 'YOU ARE NOT ALONE'];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const phraseEl = document.createElement('div');
    phraseEl.className = 'phrase';
    phraseEl.textContent = phrase;
    document.body.appendChild(phraseEl);
    
    setTimeout(() => {
      if (phraseEl.parentNode) phraseEl.remove();
    }, 4000);
  }

  function triggerFalseEnd() {
    const phrases = language === 'RU' 
      ? ['ВРЕМЯ ИСТЕКЛО', 'КОНЕЦ', 'ОНО ПРИШЛО']
      : ['TIME EXPIRED', 'THE END', 'IT IS HERE'];
    
    const overlay = document.createElement('div');
    overlay.className = 'false-end';
    overlay.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    document.body.appendChild(overlay);

    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);

    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 1000 + Math.random() * 2000);
  }

  function showFinalScreen() {
    if (timerInterval) clearInterval(timerInterval);
    
    showScreen(`
      <div class="final-screen red">
        ${language === 'RU' ? 'ОНО ИДЁТ ЗА ТОБОЙ' : 'IT IS COMING FOR YOU'}
      </div>
    `);
    
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }

  // ===================== ПРОВЕРКА СУЩЕСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ =====================
  async function checkExistingUser() {
    const telegramId = tg?.initDataUnsafe?.user?.id;
    if (!telegramId) {
      languageScreen();
      return;
    }

    try {
      const response = await fetch(`/time/${telegramId}`);
      if (response.ok) {
        const data = await response.json();
        deathDate = new Date(data.death);
        startTimer();
      } else {
        languageScreen();
      }
    } catch (error) {
      languageScreen();
    }
  }

  // Блокировка правого клика и выделения
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());

  // Запуск
  checkExistingUser();
}
