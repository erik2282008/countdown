// ===================== УТИЛИТЫ ДЛЯ РАБОТЫ С ТЕКСТОМ =====================

// С вероятностью обрывает фразу, создавая эффект «недосказанности»
export function maybeCut(text) {
  if (!text) return text;

  if (Math.random() < 0.3) {
    const min = Math.floor(text.length * 0.4);
    const max = Math.floor(text.length * 0.8);
    const cut = Math.floor(min + Math.random() * (max - min));
    return text.slice(0, cut) + '...';
  }

  return text;
}

// Обрезает текст до указанной длины с добавлением многоточия
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Экранирование для MarkdownV2 (для Telegram)
export function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// Экранирование для HTML
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Генерация случайного ID
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Форматирование времени в читаемый вид
export function formatDuration(seconds) {
  if (seconds <= 0) return '0 seconds';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

// Форматирование даты
export function formatDate(date, includeTime = true) {
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  let result = d.toLocaleDateString('en-US', options);
  
  if (includeTime) {
    result += ' ' + d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  return result;
}

// Проверка является ли значение числом
export function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// Ограничение числа в диапазоне
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Случайное число в диапазоне
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Случайный элемент массива
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Перемешивание массива (Fisher-Yates shuffle)
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Пауза в миллисекундах
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Дебаунсинг функции
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Троттлинг функции
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Глубокое клонирование объекта
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// Проверка на пустой объект
export function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  return Object.keys(obj).length === 0;
}

// Получение параметров из URL
export function getUrlParams(url) {
  const params = {};
  new URL(url).searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// Форматирование числа с разделителями
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Преобразование первого символа в верхний регистр
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Генератор хэша строки
export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Проверка мобильного устройства
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Проверка поддержки вибрации
export function isVibrationSupported() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// Воспроизведение вибрации
export function vibrate(pattern) {
  if (isVibrationSupported()) {
    navigator.vibrate(pattern);
  }
}

// Логирование с временной меткой
export function logWithTimestamp(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// Тестирование утилит
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 UTILS MODULE LOADED');
  
  // Тест функций
  console.log('🧪 maybeCut test:', maybeCut('This is a test string for cutting functionality'));
  console.log('🧪 truncate test:', truncate('This is a very long text that needs to be truncated', 20));
  console.log('🧪 escapeMarkdown test:', escapeMarkdown('Hello _world_ *test* [link]'));
  console.log('🧪 formatDuration test:', formatDuration(3661));
  console.log('🧪 randomInt test:', randomInt(1, 100));
  console.log('🧪 randomItem test:', randomItem(['a', 'b', 'c']));
  console.log('🧪 formatNumber test:', formatNumber(1234567));
  console.log('🧪 capitalize test:', capitalize('hello world'));
  console.log('🧪 simpleHash test:', simpleHash('test string'));
  
  // Проверка поддержки вибрации
  console.log('📳 Vibration supported:', isVibrationSupported());
  console.log('📱 Mobile device:', isMobileDevice());
}
