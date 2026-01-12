// ===================== ENGLISH PHRASES =====================

export const PHRASES_7D = [
  'IT IS AWARE OF YOU',
  'SEVEN DAYS IS NOT MUCH', 
  'TIME IS BLEEDING',
  'YOU ARE ALREADY LATE',
  'IT IS GETTING CLOSER',
  'EVERY SECOND COUNTS',
  'IT DOES NOT WAIT',
  'YOU CAN FEEL IT, CAN\'T YOU?',
  'DON\'T LOOK BEHIND YOU',
  'IT KNOWS YOUR NAME',
  'THE COUNTDOWN ACCELERATES',
  'YOUR BREATH SHORTENS',
  'IT SMELLS YOUR FEAR',
  'NO ESCAPE IS POSSIBLE',
  'THE MOMENT APPROACHES',
  'YOUR HEARTBEAT QUICKENS',
  'IT WATCHES FROM THE SHADOWS',
  'TIME IS NOT YOUR FRIEND',
  'THE END DRAWS NEAR',
  'IT HUNGERS FOR YOU'
];

export const PHRASES_24H = [
  'FINAL DAY',
  'THERE IS NO MORE TIME',
  'IT IS HERE',
  'THE END IS LOCKED',
  'YOU WERE WARNED',
  'THIS IS THE LAST NIGHT',
  'DO NOT FALL ASLEEP',
  'IT KNOWS WHERE YOU ARE',
  'YOUR TIME IS UP',
  'IT WATCHES YOU SLEEP',
  'THE FINAL HOUR',
  'NO TOMORROW FOR YOU',
  'IT BREATHES DOWN YOUR NECK',
  'LAST SUNSET',
  'THE VEIL THINS',
  'IT AWAITS YOUR ARRIVAL',
  'FINAL MOMENTS',
  'THE GATE IS OPENING',
  'IT CALLS YOUR NAME',
  'THIS IS THE END'
];

export const PHRASES_GENERAL = [
  'IT NOTICED YOU',
  'THE CLOCK TICKS LOUDER',
  'YOU CANNOT HIDE',
  'IT FEELS YOUR PRESENCE',
  'TIME IS RUNNING OUT',
  'THE SHADOW FOLLOWS',
  'IT DREAMS OF YOU',
  'YOUR FATE IS SEALED',
  'THE COUNTDOWN CONTINUES',
  'IT SMELLS YOUR SWEAT'
];

// ===================== РУССКИЕ ФРАЗЫ =====================

export const PHRASES_RU_7D = [
  'ОН ЗНАЕТ О ТЕБЕ',
  'НЕДЕЛЯ - ЭТО НЕМНОГО',
  'ВРЕМЯ ИСТЕКАЕТ',
  'ТЫ УЖЕ ОПОЗДАЛ',
  'ОНО ПРИБЛИЖАЕТСЯ',
  'КАЖДАЯ СЕКУНДА НА СЧЕТУ',
  'ОНО НЕ ЖДЕТ',
  'ТЫ ЧУВСТВУЕШЬ ЭТО, НЕ ТАК ЛИ?',
  'НЕ ОБОРАЧИВАЙСЯ',
  'ОН ЗНАЕТ ТВОЕ ИМЯ',
  'ОТСЧЕТ УСКОРЯЕТСЯ',
  'ТВОЕ ДЫХАНИЕ СБИВАЕТСЯ',
  'ОН ЧУВСТВУЕТ ТВОЙ СТРАХ',
  'БЕГСТВО НЕВОЗМОЖНО',
  'МОМЕНТ ПРИБЛИЖАЕТСЯ',
  'ТВОЕ СЕРДЦЕБИЕНИЕ УЧАЩАЕТСЯ',
  'ОН СЛЕДИТ ИЗ ТЕНИ',
  'ВРЕМЯ - НЕ ТВОЙ СОЮЗНИК',
  'КОНЕЦ ПРИБЛИЖАЕТСЯ',
  'ОН ЖАЖДЕТ ТЕБЯ'
];

export const PHRASES_RU_24H = [
  'ПОСЛЕДНИЙ ДЕНЬ',
  'ВРЕМЕНИ БОЛЬШЕ НЕТ',
  'ОН ЗДЕСЬ',
  'КОНЕЦ ПРЕДРЕШЕН',
  'ТЕБЯ ПРЕДУПРЕЖДАЛИ',
  'ЭТО ПОСЛЕДНЯЯ НОЧЬ',
  'НЕ ЗАСЫПАЙ',
  'ОН ЗНАЕТ, ГДЕ ТЫ',
  'ТВОЕ ВРЕМЯ ВЫШЛО',
  'ОН СЛЕДИТ ЗА ТОБОЙ',
  'ПОСЛЕДНИЙ ЧАС',
  'ЗАВТРА НЕ БУДЕТ',
  'ОН ДЫШИТ ТЕБЕ В СПИНУ',
  'ПОСЛЕДНИЙ ЗАКАТ',
  'ГРАНИЦА ИСТОНЧАЕТСЯ',
  'ОН ЖДЕТ ТВОЕГО ПРИХОДА',
  'ПОСЛЕДНИЕ МОМЕНТЫ',
  'ВРАТА ОТКРЫВАЮТСЯ',
  'ОН ЗОВЕТ ТЕБЯ ПО ИМЕНИ',
  'ЭТО КОНЕЦ'
];

export const PHRASES_RU_GENERAL = [
  'ОН ЗАМЕТИЛ ТЕБЯ',
  'ЧАСЫ ТИКАЮТ ГРОМЧЕ',
  'ТЕБЕ НЕ СПРЯТАТЬСЯ',
  'ОН ЧУВСТВУЕТ ТВОЕ ПРИСУТСТВИЕ',
  'ВРЕМЯ НА ИСХОДЕ',
  'ТЕНЬ СЛЕДУЕТ ЗА ТОБОЙ',
  'ОН ВИДИТ ТЕБЯ ВО СНЕ',
  'ТВОЯ СУДЬБА ПРЕДРЕШЕНА',
  'ОТСЧЕТ ПРОДОЛЖАЕТСЯ',
  'ОН ЧУВСТВУЕТ ТВОЙ ПОТ'
];

// ===================== ФУНКЦИИ ДЛЯ РАБОТЫ С ФРАЗАМИ =====================

// Получить случайную фразу по языку и типу
export function getRandomPhrase(language = 'EN', type = 'general') {
  const phrasesMap = {
    'EN': {
      '7d': PHRASES_7D,
      '24h': PHRASES_24H,
      'general': PHRASES_GENERAL
    },
    'RU': {
      '7d': PHRASES_RU_7D,
      '24h': PHRASES_RU_24H,
      'general': PHRASES_RU_GENERAL
    }
  };

  const phrases = phrasesMap[language]?.[type] || phrasesMap['EN'][type];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Получить фразу по оставшемуся времени
export function getPhraseByTimeLeft(language = 'EN', secondsLeft) {
  if (secondsLeft <= 86400) { // 24 часа
    return getRandomPhrase(language, '24h');
  } else if (secondsLeft <= 7 * 86400) { // 7 дней
    return getRandomPhrase(language, '7d');
  } else {
    return getRandomPhrase(language, 'general');
  }
}

// Получить все фразы для языка
export function getAllPhrases(language = 'EN') {
  return {
    '7d': language === 'RU' ? PHRASES_RU_7D : PHRASES_7D,
    '24h': language === 'RU' ? PHRASES_RU_24H : PHRASES_24H,
    'general': language === 'RU' ? PHRASES_RU_GENERAL : PHRASES_GENERAL
  };
}

// Проверка наличия фраз
export function phraseStats() {
  return {
    'EN_7D': PHRASES_7D.length,
    'EN_24H': PHRASES_24H.length,
    'EN_GENERAL': PHRASES_GENERAL.length,
    'RU_7D': PHRASES_RU_7D.length,
    'RU_24H': PHRASES_RU_24H.length,
    'RU_GENERAL': PHRASES_RU_GENERAL.length,
    'TOTAL': PHRASES_7D.length + PHRASES_24H.length + PHRASES_GENERAL.length + 
             PHRASES_RU_7D.length + PHRASES_RU_24H.length + PHRASES_RU_GENERAL.length
  };
}

console.log('💬 PHRASES MODULE LOADED');
console.log('📊 Phrase statistics:', phraseStats());
