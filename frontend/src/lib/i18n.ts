import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../translations/en.json';
import fr from '../translations/fr.json';
import kin from '../translations/kin.json';

const SUPPORTED_LANGUAGES = ['en', 'fr', 'kin'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_MAP: Record<SupportedLanguage, { label: string; nativeLabel: string; flag: string }> = {
  en: { label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  fr: { label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  kin: { label: 'Kinyarwanda', nativeLabel: 'Ikinyarwanda', flag: '🇷🇼' },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      kin: { translation: kin },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
