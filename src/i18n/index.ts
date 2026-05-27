import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ptBR from './locales/pt-BR';

export type Language = 'en' | 'pt-BR';

export const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
];

const STORAGE_KEY = 'app_language';

export function getStoredLanguage(): Language {
  return (localStorage.getItem(STORAGE_KEY) as Language) ?? 'pt-BR';
}

export function storeLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
