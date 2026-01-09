document.addEventListener('DOMContentLoaded', function() {
  console.log('🕳 COUNTDOWN APP INITIALIZING...');
  console.log('🌐 User Agent:', navigator.userAgent);
  console.log('📱 Screen:', window.screen.width, 'x', window.screen.height);
  
  // Создаем сканирующие линии для эффекта
  const scanLines = document.createElement('div');
  scanLines.className = 'scan-lines';
  document.body.appendChild(scanLines);
  console.log('📺 Scan lines initialized');
  
  // Предзагрузка медиафайлов
  preloadMedia();
  
  // Запускаем приложение с небольшой задержкой для инициализации
  setTimeout(() => {
    console.log('🚀 Starting Countdown application...');
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
  
  let loadedSounds = 0;
  let loadedImages = 0;
  
  // Предзагрузка звуков
  sounds.forEach(sound => {
    try {
      const audio = new Audio();
      audio.src = sound;
      audio.preload = 'auto';
      audio.onload = () => {
        loadedSounds++;
        console.log('🔊 Sound preloaded:', sound, `(${loadedSounds}/${sounds.length})`);
      };
      audio.onerror = () => {
        console.log('🔇 Sound preload failed:', sound);
      };
      audio.load();
    } catch (e) {
      console.log('🔇 Sound preload error:', sound, e.message);
    }
  });
  
  // Предзагрузка изображений
  images.forEach(image => {
    try {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        loadedImages++;
        console.log('🖼️ Image preloaded:', image, `(${loadedImages}/${images.length})`);
      };
      img.onerror = () => {
        console.log('❌ Image preload failed:', image);
      };
    } catch (e) {
      console.log('❌ Image preload error:', image, e.message);
    }
  });
  
  setTimeout(() => {
    console.log(`📊 Preload summary: Sounds ${loadedSounds}/${sounds.length}, Images ${loadedImages}/${images.length}`);
  }, 2000);
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
  let userInteractionCount = 0;

  console.log('🔧 App instance created');
  console.log('📱 App element:', app);
  console.log('⏰ Initial time:', new Date().toISOString());

  // Получаем Telegram WebApp объект
  let tg = null;
  try {
    tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.enableClosingConfirmation();
      console.log('✅ Telegram WebApp initialized successfully');
      console.log('👤 User data:', tg.initDataUnsafe?.user);
      console.log('🌐 App version:', tg.version);
      console.log('📏 Viewport:', tg.viewportHeight, 'x', tg.viewportStableHeight);
    } else {
      console.log('ℹ️ Telegram WebApp not detected - running in standalone mode');
    }
  } catch (e) {
    console.log('❌ Telegram WebApp initialization failed:', e.message);
  }

  // Отслеживаем взаимодействие пользователя
  const updateInteraction = () => {
    lastInteraction = Date.now();
    userInteractionCount++;
    console.log('🖱️ User interaction #' + userInteractionCount);
  };
  
  document.addEventListener('click', updateInteraction);
  document.addEventListener('touchstart', updateInteraction);
  document.addEventListener('mousemove', updateInteraction);
  document.addEventListener('keydown', updateInteraction);
  document.addEventListener('scroll', updateInteraction);

  // ===================== ВИРАЛЬНАЯ МЕХАНИКА - ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ =====================
  function initShareButton() {
    if (deathDate && !document.querySelector('.share-btn')) {
      const shareBtn = document.createElement('div');
      shareBtn.className = 'share-btn';
      shareBtn.innerHTML = '📱 SHARE RESULT';
      shareBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
      `;
      
      shareBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📤 Share button clicked');
        shareResult();
      });
      
      shareBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📤 Share button touched');
        shareResult();
      });
      
      shareBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(0) scale(1.1)';
        this.style.background = 'rgba(255, 0, 0, 0.9)';
      });
      
      shareBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.background = 'rgba(255, 0, 0, 0.8)';
      });
      
      document.body.appendChild(shareBtn);
      
      // Анимация появления
      setTimeout(() => {
        shareBtn.style.opacity = '1';
        shareBtn.style.transform = 'translateY(0) scale(1)';
        console.log('📤 Share button animation completed');
      }, 100);
      
      console.log('📤 Share button initialized');
    }
  }

  function shareResult() {
    if (!deathDate) {
      console.log('❌ No death date for sharing');
      showTemporaryMessage(language === 'RU' ? '❌ Нет данных для分享' : '❌ No data to share');
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
    
    console.log('📤 Sharing message:', fullMessage);
    console.log('📤 Days left:', daysLeft);
    console.log('📤 Language:', language);
    
    // Пытаемся использовать нативный шеринг
    if (navigator.share) {
      console.log('📤 Using native share API');
      navigator.share({
        title: 'COUNTDOWN',
        text: message,
        url: shareUrl
      }).then(() => {
        console.log('✅ Native share successful');
        showTemporaryMessage(language === 'RU' ? '✅ Успешно поделено!' : '✅ Shared successfully!');
      }).catch((error) => {
        console.log('❌ Native share failed:', error);
        console.log('📤 Falling back to clipboard');
        fallbackShare(fullMessage);
      });
    } else {
      console.log('📤 Native share not supported, using fallback');
      fallbackShare(fullMessage);
    }
  }

  function fallbackShare(fullMessage) {
    console.log('📤 Attempting clipboard copy');
    
    // Пытаемся скопировать в буфер обмена
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullMessage).then(() => {
        console.log('✅ Clipboard copy successful');
        showTemporaryMessage(language === 'RU' ? '✅ Ссылка скопирована!' : '✅ Link copied!');
      }).catch((error) => {
        console.log('❌ Clipboard copy failed:', error);
        showManualShare(fullMessage);
      });
    } else {
      console.log('❌ Clipboard API not supported');
      showManualShare(fullMessage);
    }
  }

  function showManualShare(text) {
    console.log('📤 Showing manual share instructions');
    showTemporaryMessage(language === 'RU' ? 
      `📤 Скопируйте вручную:\n${text}` : 
      `📤 Copy manually:\n${text}`
    );
  }

  function showTemporaryMessage(text) {
    console.log('💬 Showing temporary message:', text);
    
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) {
      existingMsg.remove();
      console.log('🗑️ Removed existing message');
    }
    
    const msg = document.createElement('div');
    msg.className = 'temp-message trigger-message';
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: #ff0000;
      padding: 20px 30px;
      border: 2px solid #ff0000;
      font-size: 18px;
      z-index: 9999;
      text-align: center;
      border-radius: 10px;
      animation: pulse 0.5s ease-in-out;
    `;
    
    document.body.appendChild(msg);
    console.log('💬 Message displayed');
    
    setTimeout(() => {
      if (msg.parentNode) {
        msg.remove();
        console.log('🗑️ Message removed');
      }
    }, 3000);
  }

  // ===================== СЛУЧАЙНЫЕ ЗВУКИ =====================
  function playRandomSound() {
    const sounds = ['whisper', 'scratch', 'thump', 'static'];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    
    console.log('🔊 Attempting to play sound:', sound);
    
    try {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.volume = 0.25;
      audio.play().then(() => {
        console.log('🔊 Sound played successfully:', sound);
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
    
    console.log('🖼️ Showing image flash:', image);
    
    const flash = document.createElement('div');
    flash.className = 'image-flash';
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url(/images/${image}.jpg);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(flash);
    console.log('🖼️ Flash element created');
    
    // Анимация появления
    setTimeout(() => {
      flash.style.opacity = '1';
      console.log('🖼️ Flash fade in');
    }, 50);
    
    // Анимация исчезновения
    const duration = 800 + Math.random() * 400;
    setTimeout(() => {
      flash.style.opacity = '0';
      console.log('🖼️ Flash fade out');
      setTimeout(() => {
        if (flash.parentNode) {
          flash.remove();
          console.log('🖼️ Flash removed');
        }
      }, 1000);
    }, duration);
  }

  // ===================== ТРИГГЕРНЫЕ СООБЩЕНИЯ =====================
  function checkForTriggers() {
    const now = Date.now();
    const hour = new Date().getHours();
    
    console.log('🔍 Checking triggers - Hour:', hour, 'Last app open:', now - lastAppOpen, 'Last interaction:', now - lastInteraction);
    
    // Триггер по ночному времени (22:00-6:00)
    if ((hour >= 22 || hour <= 6) && Math.random() < 0.15) {
      console.log('🌙 Night trigger activated');
      showTriggerMessage('NIGHT_TRIGGER');
    }
    
    // Триггер по быстрому возвращению (<10 секунд)
    if (now - lastAppOpen < 10000 && Math.random() < 0.4) {
      console.log('⚡ Quick return trigger activated');
      showTriggerMessage('QUICK_RETURN');
    }
    lastAppOpen = now;
    
    // Триггер по долгому бездействию (>5 минут)
    if (now - lastInteraction > 300000 && Math.random() < 0.25) {
      console.log('😴 Inactivity trigger activated');
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
    
    console.log('💬 Trigger message:', type, text);
    
    const triggerMsg = document.createElement('div');
    triggerMsg.className = 'trigger-message';
    triggerMsg.textContent = text;
    triggerMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: #ff0000;
      padding: 20px 30px;
      border: 2px solid #ff0000;
      font-size: 20px;
      z-index: 9999;
      text-align: center;
      animation: triggerPulse 4s ease-in-out;
    `;
    
    document.body.appendChild(triggerMsg);
    
    setTimeout(() => {
      if (triggerMsg.parentNode) {
        triggerMsg.remove();
        console.log('💬 Trigger message removed');
      }
    }, 4000);
  }

  // ===================== ХОРРОР-ЭФФЕКТЫ =====================
  function triggerHorrorEffect() {
    const now = Date.now();
    if (now - lastHorrorEffect < 30000) {
      console.log('👻 Horror effect skipped - too recent');
      return;
    }
    
    lastHorrorEffect = now;
    const effectType = Math.random();
    
    console.log('👻 Triggering horror effect, type:', effectType);
    
    if (effectType < 0.3) {
      // Временное покраснение цифр
      const units = document.querySelectorAll('.timer-unit');
      units.forEach(unit => {
        unit.classList.add('temporary-red');
        setTimeout(() => unit.classList.remove('temporary-red'), 2000);
      });
      console.log('🔴 Temporary red effect activated');
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
      console.log('👂 Whisper effect activated');
    }
    else if (effectType < 0.7) {
      // Кровавые подтёки
      const dripCount = 2 + Math.floor(Math.random() * 3);
      console.log('🩸 Blood drip effect, count:', dripCount);
      
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
    }
    
    // Сопровождающий звук
    if (Math.random() < 0.7) {
      console.log('🔊 Accompanying sound scheduled');
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
    console.log('🖥️ Screen updated');
  }

  function languageScreen() {
    console.log('🌐 Showing language selection screen');
    
    showScreen(`
      <div class="center">
        <div class="choice" data-lang="EN">ENGLISH</div>
        <div class="choice" data-lang="RU">РУССКИЙ</div>
      </div>
    `);
    
    const choices = document.querySelectorAll('.choice');
    console.log('🔄 Language choices created:', choices.length);
    
    choices.forEach(choice => {
      choice.addEventListener('click', function(e) {
        e.preventDefault();
        const lang = this.getAttribute('data-lang');
        console.log('✅ Language selected via click:', lang);
        setLang(lang);
      });
      
      choice.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const lang = this.getAttribute('data-lang');
        console.log('✅ Language selected via touch:', lang);
        setLang(lang);
      });
    });
  }

  function setLang(lang) {
    language = lang;
    const eulaText = lang === 'EN' ? EULA_EN : EULA_RU;
    
    console.log('📜 Setting language:', lang, 'EULA length:', eulaText.length);
    
    showScreen(`
      <div class="eula">
        <pre>${eulaText}</pre>
        <div class="accept">ACCEPT</div>
      </div>
    `);
    
    const acceptBtn = document.querySelector('.accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('✅ ACCEPT button clicked');
        acceptEula();
      });
      
      acceptBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        console.log('✅ ACCEPT button touched');
        acceptEula();
      });
      
      console.log('✅ ACCEPT button handlers attached');
    } else {
      console.log('❌ ACCEPT button not found');
    }
  }

  async function acceptEula() {
    const telegramId = tg?.initDataUnsafe?.user?.id || 'demo_' + Date.now();
    
    console.log('🔐 Accepting EULA for Telegram ID:', telegramId);
    console.log('🌐 Language:', language);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
      console.log('📡 Sending POST request to /accept');
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

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ EULA acceptance successful:', data);
        deathDate = new Date(data.death);
        console.log('📅 Death date set:', deathDate.toISOString());
        showTimerAnimation();
        setTimeout(() => startTimer(), 2000);
      } else {
        const errorText = await response.text();
        console.error('❌ Server error:', response.status, errorText);
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      // Демо-режим если сервер недоступен
      deathDate = generateWeightedTime();
      console.log('🔄 Using demo mode, death date:', deathDate.toISOString());
      showTimerAnimation();
      setTimeout(() => startTimer(), 2000);
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

  function generateWeightedTime() {
    const random = Math.random();
    let days;
    
    if (random < 0.6) {
      days = 20 + Math.floor(Math.random() * 15);
      console.log('🎲 Generated time: 20-35 days (60%)');
    } else if (random < 0.7) {
      days = 1 + Math.floor(Math.random() * 9);
      console.log('🎲 Generated time: 1-10 days (10%)');
    } else if (random < 0.9) {
      days = (50 + Math.floor(Math.random() * 50)) * 365;
      console.log('🎲 Generated time: 50-100 years (20%)');
    } else {
      days = 1;
      console.log('🎲 Generated time: 1 day (10%)');
    }
    
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    console.log('📅 Target death date:', targetDate.toISOString());
    
    return targetDate;
  }

  async function checkExistingUser() {
    const telegramId = tg?.initDataUnsafe?.user?.id;
    if (!telegramId) {
      console.log('👤 No Telegram ID, showing language screen');
      languageScreen();
      return;
    }

    console.log('👤 Checking existing user:', telegramId);
    
    try {
      const response = await fetch(`/time/${telegramId}`);
      console.log('⏰ Time check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        deathDate = new Date(data.death);
        console.log('✅ Existing user found, death date:', deathDate.toISOString());
        startTimer();
      } else {
        console.log('❌ No existing user, showing language screen');
        languageScreen();
      }
    } catch (error) {
      console.error('❌ Error checking existing user:', error);
      languageScreen();
    }
  }

  // ===================== СИСТЕМА ТАЙМЕРА =====================
  function startTimer() {
    console.log('⏱️ Starting timer system');
    showGrowingNumbers();
    
    setTimeout(() => {
      updateTimerDisplay();
      timerInterval = setInterval(updateTimerDisplay, 1000);
      console.log('✅ Timer interval set (1 second)');
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
      console.log('❌ No death date for timer update');
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

    console.log('⏰ Timer update - Years:', years, 'Days:', days, 'Hours:', hours, 'Minutes:', minutes, 'Seconds:', seconds);

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

    console.log('🎭 Effects applied:', effects.trim());

    // Обновление экрана
    showScreen(`<div class="${effects.trim()}">${timerHtml}</div>`);

    // ===================== СЛУЧАЙНЫЕ ЭФФЕКТЫ =====================
    
    // Случайные звуки (3% шанс)
    if (Math.random() < 0.03) {
      console.log('🔊 Random sound triggered');
      playRandomSound();
    }
    
    // Вспышки изображений (2% шанс)
    if (Math.random() < 0.02) {
      console.log('🖼️ Image flash triggered');
      showImageFlash();
    }
    
    // Проверка триггеров (5% шанс)
    if (Math.random() < 0.05) {
      console.log('🔍 Trigger check activated');
      checkForTriggers();
    }
    
    // Хоррор-эффекты (5% шанс)
    if (Math.random() < 0.05) {
      console.log('👻 Horror effect activated');
      triggerHorrorEffect();
    }

    // Случайные фразы (не чаще раза в 5 минут)
    const nowTime = Date.now();
    if (isRedZone && nowTime - lastPhraseTime > 300000 && Math.random() < 0.1) {
      console.log('💬 Random phrase triggered');
      showRandomPhrase();
      lastPhraseTime = nowTime;
    }

    // Вибрация в критической зоне
    if (isCritical && navigator.vibrate && Math.random() < 0.1) {
      console.log('📳 Vibration activated');
      navigator.vibrate([200, 100, 200]);
    }

    // Ложное завершение (0.1% шанс)
    if (diff > 300000 && Math.random() < 0.001) {
      console.log('🎭 False end triggered');
      triggerFalseEnd();
    }

    // Активация кнопки шеринга
    if (!shareAvailable && diff > 0) {
      shareAvailable = true;
      console.log('📱 Share button scheduled');
      setTimeout(initShareButton, 5000);
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

    console.log('🎭 False end message:', overlay.textContent);
    
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
      console.log('⏰ Timer interval cleared');
    }
    
    showScreen(`
      <div class="final-screen red">
        ${language === 'RU' ? 'ОНО ИДЁТ ЗА ТОБОЙ' : 'IT IS COMING FOR YOU'}
      </div>
    `);
    
    // Интенсивная вибрация в конце
    if (navigator.vibrate) {
      navigator.vibrate([1000, 300, 1000, 300, 1000]);
      console.log('📳 Final vibration activated');
    }
    
    // Финальный хоррор-эффект
    setTimeout(() => {
      console.log('👻 Final horror effect');
      triggerHorrorEffect();
    }, 1000);
  }

  // ===================== ЗАПУСК ПРИЛОЖЕНИЯ =====================
  console.log('🚀 Application setup complete');
  
  // Проверяем существующего пользователя в базе данных
  checkExistingUser();
}

console.log('✅ Countdown app script loaded successfully');
