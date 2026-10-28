/**
 * Система локализации для ByCode
 * Поддержка русского и английского языков
 */

// Словари переводов
const translations: Record<string, Record<string, string>> = {
  ru: {
    madeWithBlockly: 'Сделано с помощью Blockly',
    madeWithBlocklyEN: 'Made with Blockly',
  },
  en: {
    madeWithBlockly: 'Сделано с помощью Blockly',
    madeWithBlocklyEN: 'Made with Blockly',
  }
};

// Текущий язык (по умолчанию русский)
let currentLang: string = 'ru';

/**
 * Получить текущий язык пользователя
 */
function getUserLanguage(): string {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  // По умолчанию русский
  return 'ru';
}

/**
 * Установить язык приложения
 */
export function setLanguage(lang: string): void {
  currentLang = lang;
  localStorage.setItem('blocklycode-lang', lang);
}

/**
 * Получить текущий язык из localStorage или определить автоматически
 */
function getCurrentLang(): string {
  const storedLang = localStorage.getItem('blocklycode-lang');
  
  if (storedLang && (storedLang === 'ru' || storedLang === 'en')) {
    return storedLang;
  }
  
  // Автоматическое определение языка браузера
  return getUserLanguage();
}

/**
 * Получить перевод для заданного ключа
 */
export function t(key: string): string {
  const lang = currentLang || getCurrentLang();
  const dict = translations[lang];
  
  if (!dict) {
    console.warn(`Locale dictionary not found for language: ${lang}`);
    return key;
  }
  
  // Если ключ не найден в текущем языке, попробовать английский
  if (!dict[key] && lang !== 'en' && translations.en[key]) {
    return translations.en[key];
  }
  
  return dict[key] || key;
}

/**
 * Инициализация локализации
 */
export function initI18n(): void {
  currentLang = getCurrentLang();
}
