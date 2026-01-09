const tg = window.Telegram.WebApp;
tg.expand();

const app = document.getElementById('app');

let language = null;
let deathDate = null;
let lastPhraseDay = null;

// ===================== EULA =====================
const EULA_EN = `
END USER LICENSE AGREEMENT
ABSOLUTE & IRREVOCABLE VERSION
(NO EXCEPTIONS)

ENGLISH VERSION
END USER LICENSE AGREEMENT

THIS AGREEMENT CONSTITUTES A LEGALLY BINDING, FINAL, AND IRREVOCABLE CONTRACT.

By installing, accessing, executing, observing, or otherwise interacting with the Application in any form, you (“User”) acknowledge that consent has already been granted, whether consciously or otherwise.

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

shall not suspend, reset, delay, or negate the Application’s process.

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

This Agreement shall terminate only upon completion of the Application’s purpose.

User termination rights do not exist.

9. Amendments & Supremacy

The Provider may amend this Agreement:

without notice;
without publication;
with retroactive effect.

In case of conflict, the Application’s determination prevails over:

this Agreement;
User intent;
applicable law;
reality.

10. Governing Authority

This Agreement is governed by such authority as the Application recognizes, if any.

BY CONTINUING, YOU ACKNOWLEDGE THAT THE COUNTDOWN DID NOT BEGIN — IT WAS MERELY REVEALED.
`;

const EULA_RU = `
ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ
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

ПРОДОЛЖАЯ ИСПОЛЬЗОВАНИЕ, ВЫ ПОДТВЕРЖДАЕТЕ: ОТСЧЁТ НЕ НАЧАЛСЯ — ВАМ ПРОСТО СКАЗАЛИ, СКОЛЬКО ОСТАЛОСЬ.
`;

// ===================== UI =====================
function languageScreen() {
  app.innerHTML = `
    <div class="center">
      <div class="choice" onclick="setLang('EN')">ENGLISH</div>
      <div class="choice" onclick="setLang('RU')">РУССКИЙ</div>
    </div>
  `;
}

window.setLang = (l) => {
  language = l;
  app.innerHTML = `
    <div class="eula">
      <pre>${l === 'EN' ? EULA_EN : EULA_RU}</pre>
      <div class="accept" onclick="accept()">ACCEPT</div>
    </div>
  `;
};

async function accept() {
  await fetch('/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: tg.initDataUnsafe.user.id,
      language
    })
  });

  app.innerHTML = '';
  setTimeout(() => {
    app.innerHTML = `
      <div class="center">
        CALCULATION COMPLETE<br>
        YOUR TIME HAS BEEN REVEALED
      </div>
    `;
    setTimeout(loadTimer, 1500);
  }, 1200);
}

async function loadTimer() {
  const res = await fetch(`/time/${tg.initDataUnsafe.user.id}`);
  const data = await res.json();
  deathDate = new Date(data.death);
  setInterval(updateTimer, 1000);
}

// ===================== TIMER =====================
function updateTimer() {
  const now = new Date();
  let diff = deathDate - now;

  if (diff <= 0) {
    endSequence();
    return;
  }

  let sec = Math.floor(diff / 1000) % 60;
  const min = Math.floor(diff / 60000) % 60;
  const hrs = Math.floor(diff / 3600000) % 24;
  const day = Math.floor(diff / 86400000) % 365;
  const yrs = Math.floor(diff / (365 * 86400000));

  const daysLeft = Math.floor(diff / 86400000);

  let cls = '';
  if (daysLeft <= 7) cls = 'red glitch';
  if (diff <= 86400000) cls = 'red glitch blink';

  // ложный нулевой экран
  if (Math.random() < 0.001 && diff > 300000) {
    triggerFalseEnd();
  }

  // сбой секунд в последние минуты
  if (diff <= 300000 && Math.random() < 0.1) {
    sec = Math.floor(Math.random() * 60);
  }

  maybePhrase(daysLeft);

  app.innerHTML = `
    <div id="timer" class="${cls}">
      ${String(yrs).padStart(2,'0')} YRS<br>
      ${String(day).padStart(2,'0')} DAY<br>
      ${String(hrs).padStart(2,'0')} HRS<br>
      ${String(min).padStart(2,'0')} MIN<br>
      ${String(sec).padStart(2,'0')} SEC
    </div>
  `;

  // звук + вибрация за 24 часа
  if (diff <= 86400000) {
    if (navigator.vibrate) navigator.vibrate([200,100,200]);
    const audio = new Audio('/noise.mp3');
    audio.volume = 0.05;
    audio.play().catch(()=>{});
  }

  // микросбои
  if (Math.random() < 0.005) {
    document.body.style.transform = 'translate(1px,-1px)';
    setTimeout(()=>document.body.style.transform='translate(0,0)',50);
  }
  if (Math.random() < 0.003) {
    document.body.style.filter = 'invert(1)';
    setTimeout(()=>document.body.style.filter='invert(0)',80);
  }
}

// ===================== PHRASES =====================
function maybePhrase(daysLeft) {
  const today = new Date().toDateString();
  if (daysLeft <= 7 && today !== lastPhraseDay && Math.random() < 0.1) {
    lastPhraseDay = today;
    const phrases = language === 'RU'
      ? ['ТЫ НЕ ОДИН','ВРЕМЯ ИДЁТ','ОН БЛИЗКО','ТЫ ЭТО ЧУВСТВУЕШЬ']
      : ['YOU ARE NOT ALONE','TIME IS RUNNING','IT IS CLOSE','YOU CAN FEEL IT'];
    const el = document.createElement('div');
    el.className = 'phrase';
    el.innerText = phrases[Math.floor(Math.random()*phrases.length)];
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
  }
}

// ===================== FALSE END =====================
const FALSE_END_PHRASES = {
  EN: ['TIME EXPIRED','YOU ARE TOO LATE','IT HAS FOUND YOU','NO MORE SECONDS'],
  RU: ['ВРЕМЯ ИСТЕКЛО','ТЫ ОПОЗДАЛ','ОНО НАШЛО ТЕБЯ','СЕКУНД БОЛЬШЕ НЕТ']
};

function triggerFalseEnd() {
  const overlay = document.createElement('div');
  overlay.className = 'false-end';
  const arr = FALSE_END_PHRASES[language];
  overlay.innerText = arr[Math.floor(Math.random()*arr.length)];
  document.body.appendChild(overlay);

  if (navigator.vibrate) navigator.vibrate([300,100,300]);
  const audio = new Audio('/noise.mp3');
  audio.volume = 0.25;
  audio.play().catch(()=>{});

  setTimeout(()=>overlay.remove(),1000 + Math.random()*3000);
}

// ===================== REAL END =====================
function endSequence() {
  document.body.innerHTML = '';
  document.body.style.background = 'black';

  setTimeout(() => {
    const msg = document.createElement('div');
    msg.style.color = 'red';
    msg.style.fontFamily = 'monospace';
    msg.style.fontSize = '28px';
    msg.style.textAlign = 'center';
    msg.style.marginTop = '40vh';
    msg.innerText = language === 'RU'
      ? 'ОНО ИДЕТ ЗА ТОБОЙ'
      : 'IT IS COMING FOR YOU';
    document.body.appendChild(msg);

    if (navigator.vibrate) navigator.vibrate([500,200,500,200,500]);
    const audio = new Audio('/noise.mp3');
    audio.volume = 0.2;
    audio.play().catch(()=>{});
  }, 1000);
}

// блокировки
document.addEventListener('contextmenu', e => e.preventDefault());
window.onbeforeunload = () => true;

// старт
languageScreen();
