import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// @ts-expect-error Fix this later.
import Backend from './i18next-http-backend.js';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(Backend)
  .init({
    lng: 'en',
    load: 'languageOnly',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    ns: ['civitai', 'model', 'project', 'task'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
