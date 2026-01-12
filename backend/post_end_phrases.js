// ===================== ENGLISH POST-END PHRASES =====================
export const POST_END = [
  'IT IS NEAR',
  'YOU SHOULD NOT HAVE LOOKED',
  'IT IS TOO LATE',
  'IT SEES YOU',
  'DO NOT TURN AROUND',
  'YOU WERE COUNTING WRONG',
  'IT DID NOT NEED THE TIMER',
  'IT WAS HERE BEFORE ZERO',
  'TIME WAS NEVER YOURS',
  'YOU FEEL IT NOW',
  'IT KNOWS YOU READ THIS',
  'THERE IS NO AFTER',
  'YOU ARE STILL HERE',
  'WHY ARE YOU WAITING',
  'THE COUNTDOWN WAS JUST THE BEGINNING',
  'IT HAS BEEN WAITING',
  'YOUR TIME IS NOT YOUR OWN',
  'IT CAN SEE YOUR SCREEN',
  'THE NUMBERS WERE A WARNING',
  'IT IS ALREADY INSIDE',
  'DO NOT BELIEVE YOUR EYES',
  'IT WHISPERS YOUR NAME',
  'THE DOOR IS OPEN',
  'IT FEEDS ON YOUR FEAR',
  'THE COUNTDOWN WAS A DISTRACTION',
  'IT HAS MANY FACES',
  'YOU CANNOT UNSEE IT',
  'IT LIVES IN YOUR SHADOW',
  'THE TIMER WAS NEVER REAL',
  'IT IS IN THE SILENCE',
  'DO NOT TRUST THE NUMBERS',
  'IT BREATHES WITH YOU',
  'THE END WAS ONLY THE START',
  'IT COLLECTS YOUR MOMENTS',
  'YOU ARE NOT ALONE ANYMORE',
  'IT REMEMBERS YOUR HEARTBEAT',
  'THE COUNTDOWN WAS A LIE',
  'IT SEEPS THROUGH THE CRACKS',
  'DO NOT CLOSE YOUR EYES',
  'IT TASTES YOUR REGRET'
];

// ===================== РУССКИЕ ФРАЗЫ ПОСЛЕ ЗАВЕРШЕНИЯ =====================
export const POST_END_RU = [
  'ОН БЛИЗКО',
  'НЕ НАДО БЫЛО СМОТРЕТЬ',
  'СЛИШКОМ ПОЗДНО',
  'ОН ВИДИТ ТЕБЯ',
  'НЕ ОБОРАЧИВАЙСЯ',
  'ТЫ НЕПРАВИЛЬНО СЧИТАЛ',
  'ЕМУ НЕ НУЖЕН БЫЛ ТАЙМЕР',
  'ОН БЫЛ ЗДЕСЬ ДО НУЛЯ',
  'ВРЕМЯ НИКОГДА НЕ БЫЛО ТВОИМ',
  'ТЫ ЧУВСТВУЕШЬ ЭТО СЕЙЧАС',
  'ОН ЗНАЕТ, ЧТО ТЫ ЧИТАЕШЬ ЭТО',
  'ПОСЛЕ НИЧЕГО НЕТ',
  'ТЫ ВСЕ ЕЩЕ ЗДЕСЬ',
  'ПОЧЕМУ ТЫ ЖДЕШЬ',
  'ОТСЧЕТ БЫЛ ТОЛЬКО НАЧАЛОМ',
  'ОН ЖДАЛ',
  'ТВОЕ ВРЕМЯ НЕ ПРИНАДЛЕЖИТ ТЕБЕ',
  'ОН ВИДИТ ТВОЙ ЭКРАН',
  'ЦИФРЫ БЫЛИ ПРЕДУПРЕЖДЕНИЕМ',
  'ОН УЖЕ ВНУТРИ',
  'НЕ ВЕРЬ СВОИМ ГЛАЗАМ',
  'ОН ШЕПЧЕТ ТВОЕ ИМЯ',
  'ДВЕРЬ ОТКРЫТА',
  'ОН ПИТАЕТСЯ ТВОИМ СТРАХОМ',
  'ОТСЧЕТ БЫЛ ОТВЛЕЧЕНИЕМ',
  'У НЕГО МНОГО ЛИЦ',
  'ТЫ НЕ МОЖЕШЬ ОТЭТОГО ИЗБАВИТЬСЯ',
  'ОН ЖИВЕТ В ТВОЕЙ ТЕНИ',
  'ТАЙМЕР НИКОГДА НЕ БЫЛ НАСТОЯЩИМ',
  'ОН В ТИШИНЕ',
  'НЕ ДОВЕРЯЙ ЦИФРАМ',
  'ОН ДЫШИТ С ТОБОЙ',
  'КОНЕЦ БЫЛ ТОЛЬКО НАЧАЛОМ',
  'ОН СОБИРАЕТ ТВОИ МОМЕНТЫ',
  'ТЫ БОЛЬШЕ НЕ ОДИН',
  'ОН ПОМНИТ ТВОЕ СЕРДЦЕБИЕНИЕ',
  'ОТСЧЕТ БЫЛ ЛОЖЬЮ',
  'ОН ПРОСАЧИВАЕТСЯ ЧЕРЕЗ ЩЕЛИ',
  'НЕ ЗАКРЫВАЙ ГЛАЗА',
  'ОН ЧУВСТВУЕТ ТВОЕ СЖАЛЕНИЕ'
];

// ===================== ФУНКЦИИ ДЛЯ РАБОТЫ С ФРАЗАМИ =====================

// Получить случайную фразу после завершения
export function getRandomPostEndPhrase(language = 'EN') {
  const phrases = language === 'RU' ? POST_END_RU : POST_END;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Получить несколько фраз для выбора
export function getMultiplePostEndPhrases(count = 5, language = 'EN') {
  const phrases = language === 'RU' ? POST_END_RU : POST_END;
  const shuffled = [...phrases].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Поиск фраз по ключевым словам
export function searchPostEndPhrases(keyword, language = 'EN') {
  const phrases = language === 'RU' ? POST_END_RU : POST_END;
  const lowerKeyword = keyword.toLowerCase();
  return phrases.filter(phrase => 
    phrase.toLowerCase().includes(lowerKeyword)
  );
}

// Статистика фраз
export function postEndPhraseStats() {
  return {
    ENGLISH: POST_END.length,
    RUSSIAN: POST_END_RU.length,
    TOTAL: POST_END.length + POST_END_RU.length
  };
}

// Получить все фразы для языка
export function getAllPostEndPhrases(language = 'EN') {
  return language === 'RU' ? POST_END_RU : POST_END;
}

// Проверка уникальности фраз
export function checkDuplicatePhrases() {
  const englishDuplicates = POST_END.filter((phrase, index) => 
    POST_END.indexOf(phrase) !== index
  );
  
  const russianDuplicates = POST_END_RU.filter((phrase, index) => 
    POST_END_RU.indexOf(phrase) !== index
  );
  
  return {
    englishDuplicates,
    russianDuplicates,
    hasDuplicates: englishDuplicates.length > 0 || russianDuplicates.length > 0
  };
}

// Тестирование модуля
if (process.env.NODE_ENV === 'development') {
  console.log('🔤 POST-END PHRASES MODULE LOADED');
  console.log('📊 Phrase statistics:', postEndPhraseStats());
  
  const duplicates = checkDuplicatePhrases();
  if (duplicates.hasDuplicates) {
    console.warn('⚠️ Duplicate phrases detected:', duplicates);
  } else {
    console.log('✅ No duplicate phrases found');
  }
  
  // Тестовая выдача фраз
  console.log('🧪 Test phrases:');
  console.log('EN:', getRandomPostEndPhrase('EN'));
  console.log('RU:', getRandomPostEndPhrase('RU'));
}
