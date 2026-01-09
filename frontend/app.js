document.addEventListener('DOMContentLoaded', function() {
  console.log('🕳 COUNTDOWN APP INITIALIZING...');
  
  // Создаем сканирующие линии для эффекта
  const scanLines = document.createElement('div');
  scanLines.className = 'scan-lines';
  document.body.appendChild(scanLines);
  
  // Предзагрузка медиафайлов
  preloadMedia();
  
  // Запускаем приложение с небольшой задержкой для инициализации
  setTimeout(() => {
    startApp();
  }, 100);
});

// Предзагрузка медиафайлов
function preloadMedia() {
  console.log('📦 Preloading media files...');
  
  const sounds = [
    '/sounds/whisper.mp3',
    '/sounds/scratch.mp3', 
    '/sounds/thump.mp3',
    '/sounds/static.mp3'
  ];
  
  const images = [
    '/images/face1.jpg',
    '/images/face2.jpg',
    '/images/symbol1.jpg',
    '/images/glitch.jpg'
  ];
  
  // Предзагрузка звуков
  sounds.forEach(sound => {
    try {
      const audio = new Audio();
      audio.src = sound;
      audio.preload = 'auto';
      audio.load();
    } catch (e) {
      console.log('🔇 Sound preload failed:', sound);
    }
  });
  
  // Предзагрузка изображений
  images.forEach(image => {
    try {
      const img = new Image();
      img.src = image;
    } catch (e) {
      console.log('🖼️ Image preload failed:', image);
    }
  });
}

function startApp() {
  const app = document.getElementById('app');
  let language = null;
  let deathDate = null;
  let timerInterval = null;
  let lastPhraseTime = 0;
  let lastHorrorEffect = 0;
  let lastAppOpen = Date.now();
  let lastInteraction = Date.now();
  let shareAvailable = false;

  // Получаем Telegram WebApp объект
  let tg = null;
  try {
    tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.enableClosingConfirmation();
      console.log('✅ Telegram WebApp initialized');
    } else {
      console.log('ℹ️ Telegram WebApp not detected - running in standalone mode');
    }
  } catch (e) {
    console.log('❌ Telegram WebApp initialization failed');
  }

  // Отслеживаем взаимодействие пользователя
  const updateInteraction = () => {
    lastInteraction = Date.now();
  };
  
  document.addEventListener('click', updateInteraction);
  document.addEventListener('touchstart', updateInteraction);
  document.addEventListener('mousemove', updateInteraction);
  document.addEventListener('keydown', updateInteraction);

  // ===================== ВИРАЛЬНАЯ МЕХАНИКА - ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ =====================
  function initShareButton() {
    if (deathDate && !document.querySelector('.share-btn')) {
      const shareBtn = document.createElement('div');
      shareBtn.className = 'share-btn';
      shareBtn.innerHTML = '📱 SHARE RESULT';
      
      shareBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        shareResult();
      });
      
      shareBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        shareResult();
      });
      
      document.body.appendChild(shareBtn);
      
      // Анимация появления
      setTimeout(() => {
        shareBtn.style.opacity = '1';
        shareBtn.style.transform = 'translateY(0) scale(1)';
      }, 100);
      
      console.log('📤 Share button initialized');
    }
  }

  function shareResult() {
    if (!deathDate) {
      console.log('❌ No death date for sharing');
      return;
    }
    
    const now = new Date();
    const diff = deathDate - now;
    const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    
    const message = language === 'RU' 
      ? `🕳 Мой отсчёт: ${daysLeft} дней. Узнай свой!`
      : `🕳 My countdown: ${daysLeft} days. Discover yours!`;
    
    const shareUrl = window.location.href;
    const fullMessage = `${message} ${shareUrl}`;
    
    console.log('📤 Sharing:', fullMessage);
    
    // Пытаемся использовать нативный шеринг
    if (navigator.share) {
      navigator.share({
        title: 'COUNTDOWN',
        text: message,
        url: shareUrl
      }).then(() => {
        console.log('✅ Share successful');
      }).catch((error) => {
        console.log('❌ Native share failed, using fallback');
        fallbackShare(fullMessage);
      });
    } else {
      console.log('ℹ️ Native share not supported, using fallback');
      fallbackShare(fullMessage);
    }
  }

  function fallbackShare(fullMessage) {
    // Пытаемся скопировать в буфер обмена
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullMessage).then(() => {
        showTemporaryMessage(language === 'RU' ? '✅ Ссылка скопирована!' : '✅ Link copied!');
        console.log('📋 Copied to clipboard');
      }).catch(() => {
        showManualShare(fullMessage);
      });
    } else {
      showManualShare(fullMessage);
    }
  }

  function showManualShare(text) {
    showTemporaryMessage(language === 'RU' ? 
      `📤 Поделитесь вручную: ${text}` : 
      `📤 Share manually: ${text}`
    );
  }

  function showTemporaryMessage(text) {
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = 'temp-message trigger-message';
    msg.textContent = text;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      if (msg.parentNode) msg.remove();
    }, 3000);
  }

  // ===================== СЛУЧАЙНЫЕ ЗВУКИ =====================
  function playRandomSound() {
    const sounds = ['whisper', 'scratch', 'thump', 'static'];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    
    try {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.volume = 0.25;
      audio.play().then(() => {
        console.log('🔊 Sound played:', sound);
      }).catch(error => {
        console.log('🔇 Sound play failed:', error);
      });
    } catch (error) {
      console.log('🔇 Sound error:', error);
    }
  }

  // ===================== ВСПЫШКИ ИЗОБРАЖЕНИЙ =====================
  function showImageFlash() {
    const images = ['face1', 'face2', 'symbol1', 'glitch'];
    const image = images[Math.floor(Math.random() * images.length)];
    
    const flash = document.createElement('div');
    flash.className = 'image-flash';
    flash.style.backgroundImage = `url(/images/${image}.jpg)`;
    flash.style.backgroundSize = 'cover';
    flash.style.backgroundPosition = 'center';
    flash.style.backgroundRepeat = 'no-repeat';
    
    document.body.appendChild(flash);
    
    // Анимация появления
    setTimeout(() => {
      flash.style.opacity = '1';
    }, 50);
    
    // Анимация исчезновения
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        if (flash.parentNode) {
          flash.remove();
        }
      }, 1000);
    }, 800 + Math.random() * 400);
    
    console.log('🖼️ Image flash:', image);
  }

  // ===================== ТРИГГЕРНЫЕ СООБЩЕНИЯ =====================
  function checkForTriggers() {
    const now = Date.now();
    const hour = new Date().getHours();
    
    // Триггер по ночному времени (22:00-6:00)
    if ((hour >= 22 || hour <= 6) && Math.random() < 0.15) {
      showTriggerMessage('NIGHT_TRIGGER');
    }
    
    // Триггер по быстрому возвращению (<10 секунд)
    if (now - lastAppOpen < 10000 && Math.random() < 0.4) {
      showTriggerMessage('QUICK_RETURN');
    }
    lastAppOpen = now;
    
    // Триггер по долгому бездействию (>5 минут)
    if (now - lastInteraction > 300000 && Math.random() < 0.25) {
      showTriggerMessage('INACTIVITY');
    }
    
    console.log('🔍 Trigger check completed');
  }

  function showTriggerMessage(type) {
    const messages = {
      'NIGHT_TRIGGER': {
        EN: [
          'IT LIKES THE DARK',
          'NIGHT BELONGS TO IT', 
          'DARKNESS IS ITS HOME',
          'IT SEES BETTER IN THE DARK',
          'THE NIGHT HIDES ITS MOVEMENTS'
        ],
        RU: [
          'ОНО ЛЮБИТ ТЕМНОТУ',
          'НОЧЬ ПРИНАДЛЕЖИТ ЕМУ',
          'ТЬМА - ЕГО ДОМ',
          'В ТЕМНОТЕ ОНО ВИДИТ ЛУЧШЕ',
          'НОЧЬ СКРЫВАЕТ ЕГО ДВИЖЕНИЯ'
        ]
      },
      'QUICK_RETURN': {
        EN: [
          'YOU CAME BACK',
          'IT MISSED YOU',
          'RUNNING CHANGES NOTHING',
          'YOU CANNOT ESCAPE',
          'IT KNEW YOU WOULD RETURN'
        ],
        RU: [
          'ТЫ ВЕРНУЛСЯ',
          'ОНО СКУЧАЛО',
          'БЕГСТВО НИЧЕГО НЕ МЕНЯЕТ',
          'ТЕБЕ НЕ УЙТИ',
          'ОНО ЗНАЛО, ЧТО ТЫ ВЕРНЕШЬСЯ'
        ]
      },
      'INACTIVITY': {
        EN: [
          'I NOTICED YOUR SILENCE',
          'STILL THERE?',
          'IT WATCHES YOU SLEEP',
          'YOUR QUIET DOES NOT HIDE YOU',
          'IT WAITS FOR YOUR RETURN'
        ],
        RU: [
          'Я ЗАМЕТИЛ ТВОЕ МОЛЧАНИЕ',
          'ЕЩЕ ЗДЕСЬ?',
          'ОНО СЛЕДИТ ЗА ТВОИМ СНОМ',
          'ТИШИНА ТЕБЯ НЕ СПАСЕТ',
          'ОНО ЖДЕТ ТВОЕГО ВОЗВРАЩЕНИЯ'
        ]
      }
    };
    
    const messageSet = messages[type] || messages['NIGHT_TRIGGER'];
    const messageArray = language === 'RU' ? messageSet.RU : messageSet.EN;
    const text = messageArray[Math.floor(Math.random() * messageArray.length)];
    
    const triggerMsg = document.createElement('div');
    triggerMsg.className = 'trigger-message';
    triggerMsg.textContent = text;
    document.body.appendChild(triggerMsg);
    
    console.log('💬 Trigger message:', type, text);
    
    setTimeout(() => {
      if (triggerMsg.parentNode) {
        triggerMsg.remove();
      }
    }, 4000);
  }

  // ===================== ХОРРОР-ЭФФЕКТЫ =====================
  function triggerHorrorEffect() {
    const now = Date.now();
    if (now - lastHorrorEffect < 30000) return;
    
    lastHorrorEffect = now;
    const effectType = Math.random();
    
    console.log('👻 Triggering horror effect:', effectType);
    
    if (effectType < 0.3) {
      // Временное покраснение цифр
      const units = document.querySelectorAll('.timer-unit');
      units.forEach(unit => {
        unit.classList.add('temporary-red');
        setTimeout(() => {
          unit.classList.remove('temporary-red');
        }, 2000);
      });
      console.log('🔴 Temporary red effect');
    } 
    else if (effectType < 0.5) {
      // Шёпот
      const whispers = language === 'RU' 
        ? ['не смотри', 'оно близко', 'ты уже мёртв', 'беги', 'поздно', 'оно здесь']
        : ['dont look', 'it is close', 'you are dead', 'run', 'too late', 'it is here'];
      
      const whisperEl = document.createElement('div');
      whisperEl.className = 'whisper';
      whisperEl.textContent = whispers[Math.floor(Math.random() * whispers.length)];
      document.body.appendChild(whisperEl);
      
      setTimeout(() => {
        if (whisperEl.parentNode) whisperEl.remove();
      }, 6000);
      console.log('👂 Whisper effect');
    }
    else if (effectType < 0.7) {
      // Кровавые подтёки
      const dripCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < dripCount; i++) {
        setTimeout(() => {
          const drip = document.createElement('div');
          drip.className = 'blood-drip';
          drip.style.left = Math.random() * 80 + 10 + 'vw';
          drip.style.animationDelay = (Math.random() * 2) + 's';
          document.body.appendChild(drip);
          
          setTimeout(() => {
            if (drip.parentNode) drip.remove();
          }, 3000);
        }, i * 500);
      }
      console.log('🩸 Blood drip effect');
    }
    
    // Сопровождающий звук
    if (Math.random() < 0.7) {
      setTimeout(playRandomSound, 500);
    }
  }

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

  // ===================== ОСНОВНЫЕ ФУНКЦИИ ИНТЕРФЕЙСА =====================
  function showScreen(html) {
    app.innerHTML = html;
  }

  function languageScreen() {
    console.log('🌐 Showing language selection screen');
    
    showScreen(`
      <div class="center">
        <div class="choice" data-lang="EN">ENGLISH</div>
        <div class="choice" data-lang="RU">РУССКИЙ</div>
      </div>
    `);
    
    // Добавляем обработчики событий
    const choices = document.querySelectorAll('.choice');
    choices.forEach(choice => {
      choice.addEventListener('click', function(e) {
        e.preventDefault();
        const lang = this.getAttribute('data-lang');
        console.log('✅ Language selected:', lang);
        setLang(lang);
      });
      
      choice.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const lang = this.getAttribute('data-lang');
        console.log('✅ Language selected (touch):', lang);
        setLang(lang);
      });
    });
  }

  function setLang(lang) {
    language = lang;
    const eulaText = lang === 'EN' ? EULA_EN : EULA_RU;
    
    console.log('📜 Showing EULA for language:', lang);
    
    showScreen(`
      <div class="eula">
        <pre>${eulaText}</pre>
        <div class="accept">ACCEPT</div>
      </div>
    `);
    
    // Обработчик для кнопки ACCEPT
    const acceptBtn = document.querySelector('.accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('✅ EULA accepted');
        acceptEula();
      });
      
      acceptBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        console.log('✅ EULA accepted (touch)');
        acceptEula();
      });
    } else {
      console.log('❌ ACCEPT button not found');
    }
  }

  async function acceptEula() {
    const telegramId = tg?.initDataUnsafe?.user?.id || 'demo_' + Date.now();
    console.log('🔐 Processing EULA acceptance for ID:', telegramId);
    
    try {
      const response = await fetch('/accept', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          telegram_id: telegramId, 
          language: language 
        })
      });

      if (response.ok) {
        console.log('✅ EULA acceptance recorded');
        showTimerAnimation();
        setTimeout(() => loadTimerData(telegramId), 2000);
      } else {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ EULA acceptance failed:', error);
      showScreen('<div class="center">NETWORK ERROR - TRY AGAIN</div>');
      setTimeout(languageScreen, 2000);
    }
  }

  function showTimerAnimation() {
    console.log('🔮 Showing timer animation');
    showScreen(`
      <div class="calculation-screen">
        <div class="calculation-title">CALCULATION COMPLETE</div>
        <div class="calculation-subtitle">YOUR TIME HAS BEEN REVEALED</div>
      </div>
    `);
  }

  async function loadTimerData(telegramId) {
    console.log('⏰ Loading timer data for:', telegramId);
    
    try {
      const response = await fetch(`/time/${telegramId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        deathDate = new Date(data.death);
        console.log('✅ Death date loaded:', deathDate.toISOString());
      } else {
        console.log('ℹ️ No existing timer data, generating new one');
        deathDate = generateWeightedTime();
      }
    } catch (error) {
      console.error('❌ Timer data load failed, using demo time:', error);
      deathDate = generateWeightedTime();
    }
    
    startTimer();
  }

  function generateWeightedTime() {
    const random = Math.random();
    let days;
    
    if (random < 0.6) {
      days = 20 + Math.floor(Math.random() * 15); // 60% - 20-35 дней
      console.log('🎲 Generated time: 20-35 days');
    } else if (random < 0.7) {
      days = 1 + Math.floor(Math.random() * 9); // 10% - 1-10 дней
      console.log('🎲 Generated time: 1-10 days');
    } else if (random < 0.9) {
      days = (50 + Math.floor(Math.random() * 50)) * 365; // 20% - 50-100 лет
      console.log('🎲 Generated time: 50-100 years');
    } else {
      days = 1; // 10% - 1 день
      console.log('🎲 Generated time: 1 day');
    }
    
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    console.log('📅 Target death date:', targetDate.toISOString());
    
    return targetDate;
  }

  // ===================== СИСТЕМА ТАЙМЕРА =====================
  function startTimer() {
    console.log('⏱️ Starting timer system');
    showGrowingNumbers();
    
    setTimeout(() => {
      updateTimerDisplay();
      timerInterval = setInterval(updateTimerDisplay, 1000);
      console.log('✅ Timer started with 1s interval');
    }, 800);
  }

  function showGrowingNumbers() {
    console.log('🔢 Showing number growth animation');
    
    const numbers = ['00', '00', '00', '00', '00'];
    const labels = ['YEARS', 'DAYS', 'HOURS', 'MINUTES', 'SECONDS'];
    
    let html = '';
    numbers.forEach((num, index) => {
      html += `
        <div class="timer-unit number-animation" style="animation-delay: ${index * 0.1}s">${num}</div>
        <div class="timer-label">${labels[index]}</div>
      `;
    });
    
    showScreen(`<div class="timer-container">${html}</div>`);
  }

  function updateTimerDisplay() {
    if (!deathDate) {
      console.log('❌ No death date for timer');
      return;
    }

    const now = new Date();
    let diff = deathDate - now;

    // Проверка окончания таймера
    if (diff <= 0) {
      console.log('⏰ Timer reached zero');
      showFinalScreen();
      return;
    }

    // Вычисление временных единиц
    const years = Math.floor(diff / (365 * 86400000));
    const days = Math.floor((diff % (365 * 86400000)) / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    // Логика красных цифр (последовательное покраснение)
    const yrsRed = years === 0;
    const dayRed = yrsRed && days === 0;
    const hrsRed = yrsRed && dayRed && hours === 0;
    const minRed = yrsRed && dayRed && hrsRed && minutes === 0;
    const secRed = yrsRed && dayRed && hrsRed && minRed && seconds === 0;

    // Генерация HTML таймера
    const timerHtml = `
      <div class="timer-container">
        <div class="timer-unit ${yrsRed ? 'red' : ''}">${String(years).padStart(2, '0')}</div>
        <div class="timer-label">YEARS</div>
        
        <div class="timer-unit ${dayRed ? 'red' : ''}">${String(days).padStart(2, '0')}</div>
        <div class="timer-label">DAYS</div>
        
        <div class="timer-unit ${hrsRed ? 'red' : ''}">${String(hours).padStart(2, '0')}</div>
        <div class="timer-label">HOURS</div>
        
        <div class="timer-unit ${minRed ? 'red' : ''}">${String(minutes).padStart(2, '0')}</div>
        <div class="timer-label">MINUTES</div>
        
        <div class="timer-unit ${secRed ? 'red' : ''}">${String(seconds).padStart(2, '0')}</div>
        <div class="timer-label">SECONDS</div>
      </div>
    `;

    // Определение эффектов
    const isRedZone = diff <= 7 * 86400000; // Красная зона - 7 дней
    const isCritical = diff <= 86400000; // Критическая зона - 24 часа
    
    let effects = '';
    if (isRedZone) effects += 'glitch ';
    if (isCritical) effects += 'blink ';
    if (Math.random() < 0.03) effects += 'distort ';
    if (Math.random() < 0.02) effects += 'flicker ';

    // Обновление экрана
    showScreen(`<div class="${effects.trim()}">${timerHtml}</div>`);

    // ===================== СЛУЧАЙНЫЕ ЭФФЕКТЫ =====================
    
    // Случайные звуки (3% шанс)
    if (Math.random() < 0.03) {
      playRandomSound();
    }
    
    // Вспышки изображений (2% шанс)
    if (Math.random() < 0.02) {
      showImageFlash();
    }
    
    // Проверка триггеров (5% шанс)
    if (Math.random() < 0.05) {
      checkForTriggers();
    }
    
    // Хоррор-эффекты (5% шанс)
    if (Math.random() < 0.05) {
      triggerHorrorEffect();
    }

    // Случайные фразы (не чаще раза в 5 минут)
    const nowTime = Date.now();
    if (isRedZone && nowTime - lastPhraseTime > 300000 && Math.random() < 0.1) {
      showRandomPhrase();
      lastPhraseTime = nowTime;
    }

    // Вибрация в критической зоне
    if (isCritical && navigator.vibrate && Math.random() < 0.1) {
      navigator.vibrate([200, 100, 200]);
    }

    // Ложное завершение (0.1% шанс)
    if (diff > 300000 && Math.random() < 0.001) {
      triggerFalseEnd();
    }

    // Активация кнопки шеринга
    if (!shareAvailable && diff > 0) {
      shareAvailable = true;
      setTimeout(initShareButton, 5000);
    }

    // Логирование состояния (редко)
    if (Math.random() < 0.001) {
      console.log('⏰ Timer update - Diff:', diff, 'Days left:', Math.floor(diff/86400000));
    }
  }

  function showRandomPhrase() {
    const phrases = language === 'RU' 
      ? ['ОН БЛИЗКО', 'ТЫ ЭТО ЧУВСТВУЕШЬ', 'НЕ СМОТРИ НАЗАД', 'ОНО ВИДИТ ТЕБЯ', 
         'ВРЕМЯ ИДЁТ', 'ТЫ НЕ ОДИН', 'БЕГИ', 'ПОЗДНО', 'ОНО ЗДЕСЬ']
      : ['IT IS CLOSE', 'YOU CAN FEEL IT', 'DONT LOOK BACK', 'IT SEES YOU', 
         'TIME IS RUNNING', 'YOU ARE NOT ALONE', 'RUN', 'TOO LATE', 'IT IS HERE'];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const phraseEl = document.createElement('div');
    phraseEl.className = 'phrase';
    phraseEl.textContent = phrase;
    document.body.appendChild(phraseEl);
    
    console.log('💬 Random phrase:', phrase);
    
    setTimeout(() => {
      if (phraseEl.parentNode) phraseEl.remove();
    }, 5000);
  }

  function triggerFalseEnd() {
    const phrases = language === 'RU' 
      ? ['ВРЕМЯ ИСТЕКЛО', 'КОНЕЦ', 'ОНО ПРИШЛО', 'ТЫ МЕРТВ', 'ВСЁ КОНЧЕНО']
      : ['TIME EXPIRED', 'THE END', 'IT IS HERE', 'YOU ARE DEAD', 'IT IS OVER'];
    
    const overlay = document.createElement('div');
    overlay.className = 'false-end';
    overlay.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    document.body.appendChild(overlay);

    console.log('🎭 False end triggered');
    
    // Вибрация для ложного конца
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300]);
    }

    // Автоматическое удаление
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
        console.log('🎭 False end removed');
      }
    }, 1500 + Math.random() * 2000);
  }

  function showFinalScreen() {
    console.log('💀 Showing final screen');
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    showScreen(`
      <div class="final-screen red">
        ${language === 'RU' ? 'ОНО ИДЁТ ЗА ТОБОЙ' : 'IT IS COMING FOR YOU'}
      </div>
    `);
    
    // Интенсивная вибрация в конце
    if (navigator.vibrate) {
      navigator.vibrate([1000, 300, 1000, 300, 1000]);
    }
    
    // Финальный хоррор-эффект
    setTimeout(() => {
      triggerHorrorEffect();
    }, 1000);
  }

  // ===================== ЗАПУСК ПРИЛОЖЕНИЯ =====================
  console.log('🚀 Starting Countdown application...');
  
  // Убираем loading сообщение и показываем выбор языка
  setTimeout(() => {
    languageScreen();
  }, 300);
}

console.log('✅ Countdown app script loaded successfully');
