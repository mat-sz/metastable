import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// @ts-expect-error Fix this later.
import Backend from './i18next-http-backend.js';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    ns: ['civitai', 'model', 'project', 'task'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
